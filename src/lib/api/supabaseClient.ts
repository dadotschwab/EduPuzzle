/**
 * @fileoverview Supabase query wrapper with centralized error handling
 *
 * Provides a consistent interface for executing Supabase queries
 * with automatic error handling and type safety
 *
 * @module lib/api/supabaseClient
 */

import { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Custom error class for Supabase query errors
 * Preserves the original Supabase error for debugging
 */
export class SupabaseQueryError extends Error {
  constructor(
    public originalError: PostgrestError,
    public table?: string,
    public operation?: string
  ) {
    super(originalError.message)
    this.name = 'SupabaseQueryError'
  }
}



  // Treat null data as an error for consistency
  if (data === null) {
    throw new SupabaseQueryError(
      {
        message: 'Query returned null data',
        code: 'NULL_DATA',
        details: '',
        hint: '',
      } as PostgrestError,
      context?.table,
      context?.operation
    )
  }

  return data
}

/**
 * Executes a Supabase mutation (insert, update, delete) with error handling
 * Similar to query() but optimized for mutations
 *
 * @param mutationFn - Function that returns a Supabase mutation result
 * @param context - Optional context for better error messages
 * @returns The mutation data
 * @throws SupabaseQueryError if the mutation fails
 *
 * @example
 * ```typescript
 * const newWord = await mutate(
 *   () => supabase.from('words').insert(wordData).select().single(),
 *   { table: 'words', operation: 'insert' }
 * )
 * ```
 */
export async function mutate<T>(
  mutateFn: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  context?: { table?: string; operation?: string }
): Promise<T> {
  const { data, error } = await mutateFn()

  if (error) {
    throw new SupabaseQueryError(error, context?.table, context?.operation)
  }

  if (data === null) {
    throw new SupabaseQueryError(
      {
        message: 'Mutation returned null data',
        code: 'NULL_DATA',
        details: '',
        hint: '',
      } as PostgrestError,
      context?.table,
      context?.operation
    )
  }

  return data
}

// Enhanced query wrapper with auth guarding
export async function query<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options: {
    requireAuth?: boolean
    table?: string
    operation?: string
  } = {}
): Promise<T> {
  const { requireAuth = true } = options

  // Auth guard check
  if (requireAuth) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Authentication required for this operation')
    }
  }

  try {
    const { data, error } = await queryFn()

    if (error) {
      // Handle specific auth errors
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        throw new Error('Authentication expired. Please log in again.')
      }

      throw new SupabaseQueryError(error, options.table, options.operation)
    }

    if (data === null) {
      throw new SupabaseQueryError(
        {
          message: 'Query returned null data',
          code: 'NULL_DATA',
          details: '',
          hint: '',
        } as PostgrestError,
        options.table,
        options.operation
      )
    }

    return data
  } catch (error) {
    // Re-throw with additional context
    if (error instanceof SupabaseQueryError) {
      throw error
    }

    throw new Error(
      `Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Enhanced mutate wrapper
export async function mutate<T>(
  mutateFn: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  options: {
    requireAuth?: boolean
    table?: string
    operation?: string
    optimisticUpdate?: () => void
    rollback?: () => void
  } = {}
): Promise<T> {
  const { optimisticUpdate, rollback } = options

  // Apply optimistic update if provided
  optimisticUpdate?.()

  try {
    const result = await query(mutateFn, options)
    return result
  } catch (error) {
    // Rollback optimistic update on error
    rollback?.()
    throw error
  }
}

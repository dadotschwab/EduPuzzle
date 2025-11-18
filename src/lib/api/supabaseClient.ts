/**
 * @fileoverview Supabase query wrapper with centralized error handling
 *
 * Provides a consistent interface for executing Supabase queries
 * with automatic error handling and type safety
 *
 * @module lib/api/supabaseClient
 */

import { PostgrestError } from '@supabase/supabase-js'

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

/**
 * Executes a Supabase query and handles errors consistently
 *
 * @param queryFn - Function that returns a Supabase query result
 * @param context - Optional context for better error messages
 * @returns The query data, guaranteed to be non-null
 * @throws SupabaseQueryError if the query fails or returns null
 *
 * @example
 * ```typescript
 * const words = await query(
 *   () => supabase.from('words').select('*').eq('list_id', listId),
 *   { table: 'words', operation: 'select' }
 * )
 * ```
 */
export async function query<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: { table?: string; operation?: string }
): Promise<T> {
  const { data, error } = await queryFn()

  if (error) {
    throw new SupabaseQueryError(error, context?.table, context?.operation)
  }

  // Treat null data as an error for consistency
  if (data === null) {
    throw new SupabaseQueryError(
      {
        message: 'Query returned null data',
        code: 'NULL_DATA',
        details: '',
        hint: ''
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
  mutationFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context?: { table?: string; operation?: string }
): Promise<T> {
  // Mutations use the same logic as queries
  return query(mutationFn, context)
}

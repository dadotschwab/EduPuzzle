/**
 * @fileoverview Puzzle Session API functions
 */

import { supabase } from '@/lib/supabase'
import { query, mutate } from './supabaseClient'
import type { Database } from '@/types/database'

type PuzzleSessionInsert = Database['public']['Tables']['puzzle_sessions']['Insert']
type PuzzleSessionUpdate = Database['public']['Tables']['puzzle_sessions']['Update']

export interface PuzzleSession {
  id: string
  user_id: string
  list_id: string | null
  started_at: string
  completed_at: string | null
  puzzle_data: unknown
  total_words: number
  correct_words: number
}

export async function createPuzzleSession(session: {
  listId: string | null
  puzzleData: unknown
  totalWords: number
}): Promise<PuzzleSession> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const insertData: PuzzleSessionInsert = {
    user_id: user.id,
    list_id: session.listId,
    puzzle_data: session.puzzleData as Database['public']['Tables']['puzzle_sessions']['Row']['puzzle_data'],
    total_words: session.totalWords,
  }

  return mutate(
    () => supabase.from('puzzle_sessions').insert(insertData).select().single(),
    { table: 'puzzle_sessions', operation: 'insert' }
  )
}

export async function completePuzzleSession(
  id: string,
  correctWords: number
): Promise<PuzzleSession> {
  const updateData: PuzzleSessionUpdate = {
    completed_at: new Date().toISOString(),
    correct_words: correctWords,
  }

  return mutate(
    () => supabase
      .from('puzzle_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single(),
    { table: 'puzzle_sessions', operation: 'update' }
  )
}

export async function getPuzzleSessions(listId?: string): Promise<PuzzleSession[]> {
  const query_builder = supabase
    .from('puzzle_sessions')
    .select('*')
    .order('started_at', { ascending: false })

  if (listId) {
    query_builder.eq('list_id', listId)
  }

  return query(
    () => query_builder,
    { table: 'puzzle_sessions', operation: 'select' }
  )
}

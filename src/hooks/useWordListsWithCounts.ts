import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WordList } from '@/types'

export interface WordListWithCount extends WordList {
  wordCount: number
}

async function getWordListsWithCounts(): Promise<WordListWithCount[]> {
  // Get all word lists
  const { data: lists, error: listsError } = await supabase
    .from('word_lists')
    .select('*')
    .order('created_at', { ascending: false })

  if (listsError) throw listsError
  if (!lists) return []

  // Get word counts for each list
  const listsWithCounts = await Promise.all(
    lists.map(async (list: any) => {
      const { count, error } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id)

      if (error) throw error

      return {
        ...list,
        wordCount: count || 0,
      } as WordListWithCount
    })
  )

  return listsWithCounts
}

export function useWordListsWithCounts() {
  return useQuery({
    queryKey: ['wordListsWithCounts'],
    queryFn: getWordListsWithCounts,
  })
}

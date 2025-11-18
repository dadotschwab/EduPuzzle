/**
 * Edge Function: Get Today's Puzzles
 *
 * Generates crossword puzzles from due words with server-side caching.
 * This moves expensive puzzle generation from client to server, ensuring:
 * - Consistent puzzles (same words = same puzzle due to deterministic seed)
 * - Better performance (cached for 24 hours)
 * - No race conditions on client
 *
 * @module functions/get-todays-puzzles
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { generatePuzzles } from './generator.ts'
import type { Word } from './types.ts'

interface WordWithProgress extends Word {
  listName: string
  source_language: string
  target_language: string
  progress?: {
    nextReviewDate: string
    stage: number
    easeFactor: number
    intervalDays: number
  }
}

interface TodaysPuzzlesResponse {
  puzzles: any[] // Puzzle objects
  totalWords: number
  message?: string
  cached?: boolean
}

const MIN_WORDS_FOR_PUZZLE = 10
const MAX_WORDS_PER_SESSION = 50 // Limit to prevent timeout with large word counts

/**
 * CORS headers for Edge Function
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[Edge Function] Fetching puzzles for user: ${user.id}`)

    // Step 1: Fetch due words
    const today = new Date().toISOString().split('T')[0]

    const { data: dueWordsData, error: fetchError } = await supabaseClient
      .from('words')
      .select(`
        id,
        list_id,
        term,
        translation,
        definition,
        example_sentence,
        created_at,
        word_lists!inner (
          id,
          name,
          source_language,
          target_language,
          user_id
        ),
        word_progress (
          id,
          user_id,
          word_id,
          stage,
          ease_factor,
          interval_days,
          next_review_date,
          last_reviewed_at,
          total_reviews,
          correct_reviews,
          incorrect_reviews,
          current_streak,
          updated_at
        )
      `)
      .eq('word_lists.user_id', user.id)

    if (fetchError) {
      console.error('[Edge Function] Error fetching due words:', fetchError)
      throw fetchError
    }

    // Filter for due words (client-side filtering since Supabase query is complex)
    const dueWords: WordWithProgress[] = (dueWordsData || [])
      .filter((word: any) => {
        const progress = word.word_progress?.[0]

        // New words (no progress yet) are due
        if (!progress) return true

        // Check if due for review today
        const nextReview = progress.next_review_date
        if (!nextReview) return true

        const isDue = nextReview <= today

        // Check if already reviewed today
        const lastReviewed = progress.last_reviewed_at
        const alreadyReviewedToday = lastReviewed === today

        return isDue && !alreadyReviewedToday
      })
      .map((word: any) => {
        const list = word.word_lists
        const progress = word.word_progress?.[0]

        return {
          id: word.id,
          listId: word.list_id,
          term: word.term,
          translation: word.translation,
          definition: word.definition || undefined,
          exampleSentence: word.example_sentence || undefined,
          createdAt: word.created_at,
          listName: list.name,
          source_language: list.source_language,
          target_language: list.target_language,
          progress: progress ? {
            nextReviewDate: progress.next_review_date,
            stage: progress.stage,
            easeFactor: progress.ease_factor,
            intervalDays: progress.interval_days,
          } : undefined,
        }
      })

    console.log(`[Edge Function] Found ${dueWords.length} due words`)

    // Step 2: Prioritize most overdue words and limit to prevent timeout
    const prioritizedWords = dueWords.sort((a, b) => {
      const aDate = a.progress?.nextReviewDate || today
      const bDate = b.progress?.nextReviewDate || today
      return aDate.localeCompare(bDate) // Earlier dates (more overdue) first
    })

    // Limit to MAX_WORDS_PER_SESSION to prevent timeout
    const wordsToUse = prioritizedWords.slice(0, MAX_WORDS_PER_SESSION)

    if (wordsToUse.length < dueWords.length) {
      console.log(`[Edge Function] Limited to ${wordsToUse.length} most overdue words (${dueWords.length} total due)`)
    }

    // Step 3: Check if we have enough words
    if (wordsToUse.length === 0) {
      return new Response(
        JSON.stringify({
          puzzles: [],
          totalWords: dueWords.length,
          message: 'No words due for review today. Great job staying on top of your vocabulary!',
        } as TodaysPuzzlesResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (wordsToUse.length < MIN_WORDS_FOR_PUZZLE) {
      return new Response(
        JSON.stringify({
          puzzles: [],
          totalWords: dueWords.length,
          message: `You have ${dueWords.length} word(s) due, but we need at least ${MIN_WORDS_FOR_PUZZLE} words in the same language pair to create a puzzle. Add more words to your lists!`,
        } as TodaysPuzzlesResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Step 4: Create cache key from sorted word IDs
    const wordIds = wordsToUse.map(w => w.id).sort()

    // Step 4: Check cache
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('puzzle_cache')
      .select('puzzle_data, valid_until')
      .eq('user_id', user.id)
      .eq('word_ids', wordIds)
      .gte('valid_until', new Date().toISOString())
      .maybeSingle()

    if (cachedData && !cacheError) {
      console.log('[Edge Function] Cache HIT - returning cached puzzles')
      return new Response(
        JSON.stringify({
          ...(cachedData.puzzle_data as any),
          cached: true,
        } as TodaysPuzzlesResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[Edge Function] Cache MISS - generating new puzzles')

    // Step 5: Generate puzzles with deterministic seed
    const seed = wordIds.join('|') // Same words = same seed = same puzzle
    console.log(`[Edge Function] Using seed: ${seed.substring(0, 50)}...`)

    const puzzles = await generatePuzzles(wordsToUse, {
      maxGridSize: 16,
      minGridSize: 10,
      seed,
    })

    console.log(`[Edge Function] Generated ${puzzles.length} puzzles`)

    const response: TodaysPuzzlesResponse = {
      puzzles,
      totalWords: dueWords.length, // Show total words due, not just what we're using
      message: wordsToUse.length < dueWords.length
        ? `Showing ${wordsToUse.length} most overdue words (${dueWords.length} total due)`
        : undefined,
    }

    // Step 6: Cache the result for 24 hours
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error: cacheInsertError } = await supabaseClient
      .from('puzzle_cache')
      .upsert({
        user_id: user.id,
        word_ids: wordIds,
        puzzle_data: response,
        valid_until: validUntil,
      })

    if (cacheInsertError) {
      console.error('[Edge Function] Failed to cache puzzles:', cacheInsertError)
      // Continue anyway - we have the puzzles generated
    } else {
      console.log('[Edge Function] Cached puzzles until', validUntil)
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[Edge Function] Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

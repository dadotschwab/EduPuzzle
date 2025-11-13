Project Context
EDU-PUZZLE is a vocabulary learning web application that generates personalized crossword puzzles from user-created word lists, utilizing spaced repetition for optimal learning retention.
Quick Commands
When working on this project, you can use these shortcuts:

@generate-puzzle-algo - Work on crossword generation algorithm
@srs-logic - Implement spaced repetition system
@fix-connectivity - Debug grid connectivity issues
@stripe-webhook - Set up payment webhooks
@optimize-performance - Improve generation speed

Tech Stack Reference
yamlFrontend:
  - React 18 + Vite 5 + TypeScript
  - TailwindCSS + shadcn/ui
  - Zustand (state) + React Query (server state)
  - React Router 6

Backend:
  - Supabase (PostgreSQL + Auth + Edge Functions)
  - Deno runtime for Edge Functions
  
Payments:
  - Stripe (subscription model)
  - Webhook handling via Edge Functions
Critical Constraints

Puzzle Generation MUST:

Include ALL due words (100% coverage)
Maintain grid connectivity (no islands)
Complete in <5 seconds
Generate multiple puzzles if needed for all words


Business Rules:

7-day free trial, then subscription-only
€6.99/month pricing
No freemium features
Desktop-first design


Technical Constraints:

No Python (TypeScript/JavaScript only)
Avoid expensive operations (keep costs < revenue)
ChromeOS/Crostini compatible development



Database Schema Summary
sqlKey Tables:
- users (subscription_status, trial_end_date)
- word_lists (user's vocabulary collections)
- words (term, translation, definition)
- word_progress (SRS tracking per user/word)
- puzzle_sessions (generated puzzles)
- word_reviews (individual word performance)

Key Indexes:
- word_progress(user_id, next_review_date)
- puzzle_sessions(user_id, started_at DESC)
Algorithm Specifications
Crossword Generation Core Logic
typescript// CRITICAL: Use Incremental Best-Fit, NOT backtracking
class PuzzleGenerator {
  // 1. Always place longest word first in center
  // 2. Find all possible crossings for each new word
  // 3. Score placements by crossing count
  // 4. Validate connectivity after each placement
  // 5. Split into multiple puzzles if needed
}

// Key optimization: Pre-calculate letter frequencies
const letterWeights = {
  'e': 1, 'n': 1, 'r': 1,  // Common
  'q': 3, 'x': 3, 'z': 3   // Rare
};
Spaced Repetition Intervals
typescriptconst intervals = [1, 3, 7, 14, 30, 90, 180]; // days

ReviewTypes:
- 'perfect': next interval
- 'half_known': next interval  
- 'conditional': same interval
- 'unknown': reset to day 1
- 'not_evaluated': no change (>70% revealed)
```

## Component Structure
```
src/
├── components/
│   ├── puzzle/
│   │   ├── Grid.tsx          // Interactive crossword grid
│   │   ├── Clues.tsx         // Across/Down hints
│   │   └── Controls.tsx      // Check/Submit/Hint buttons
│   ├── words/
│   │   ├── ListManager.tsx   // CRUD for word lists
│   │   └── WordInput.tsx     // Add/edit words
│   └── subscription/
│       └── CheckoutFlow.tsx  // Stripe integration
├── lib/
│   ├── algorithms/
│   │   ├── generator.ts      // Puzzle generation
│   │   ├── connectivity.ts   // Grid validation
│   │   └── clustering.ts     // Word grouping
│   └── srs/
│       └── engine.ts         // Spaced repetition logic
└── hooks/
    ├── usePuzzle.ts         // Puzzle state management
    └── useSubscription.ts   // Payment state
Common Issues & Solutions
Issue: Puzzle generation timeout
typescript// Solution: Use time-bounded generation
const puzzle = await Promise.race([
  generatePuzzle(words),
  new Promise((_, reject) => 
    setTimeout(() => reject('timeout'), 5000)
  )
]);
// Fallback: Split words into smaller groups
Issue: Words won't cross
typescript// Solution: Use letter frequency analysis
function scoreCrossingPotential(word1: string, word2: string) {
  const common = intersection(
    new Set(word1), 
    new Set(word2)
  );
  return common.size * avgLetterFrequency(common);
}
Issue: Subscription webhook failures
typescript// Always verify Stripe signatures
const sig = req.headers.get('stripe-signature');
if (!verifyWebhookSignature(payload, sig)) {
  return new Response('Invalid signature', { status: 400 });
}
// Implement idempotency
if (await hasProcessedEvent(event.id)) {
  return new Response('Already processed', { status: 200 });
}
Development Workflow
Initial Setup
bash# Clone and install
git clone [repo]
pnpm install

# Environment variables (.env.local)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Database setup
pnpm supabase:init
pnpm supabase:migrate
Git Branch Strategy
bashmain          # Production
├── staging   # Pre-production testing
└── dev       # Active development
    └── feature/* # Individual features
Testing Commands
bashpnpm test:unit      # Algorithm tests
pnpm test:int       # API tests  
pnpm test:e2e       # User flow tests
pnpm test:generate  # Puzzle generation benchmarks
Performance Optimization Checklist

 Implement Web Worker for puzzle generation
 Add Redis caching for frequently accessed words
 Use database connection pooling
 Lazy load puzzle solver component
 Implement virtual scrolling for large word lists
 Pre-generate next day's puzzles in background
 Use React.memo for Grid cells
 Batch API calls in React Query

Supabase Edge Function Templates
Generate Puzzle Endpoint
typescriptimport { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  const { userId, listId } = await req.json()
  
  // 1. Get due words with progress
  const { data: dueWords } = await supabase
    .from('words')
    .select(`
      *,
      word_progress!inner(
        next_review_date,
        repetition_level
      )
    `)
    .eq('word_progress.user_id', userId)
    .lte('word_progress.next_review_date', 'today')
    
  // 2. Generate puzzles
  const puzzles = await generatePuzzles(dueWords)
  
  // 3. Store sessions
  const { data: sessions } = await supabase
    .from('puzzle_sessions')
    .insert(puzzles.map(p => ({
      user_id: userId,
      list_id: listId,
      puzzle_data: p,
      total_words: p.words.length
    })))
    .select()
    
  return new Response(JSON.stringify({ sessions }))
})
Code Quality Rules

TypeScript Strict Mode: Always enabled
No any types: Use unknown or proper types
Error Boundaries: Wrap puzzle components
Loading States: Every async operation
Optimistic Updates: For better UX
Accessibility: ARIA labels, keyboard navigation

**JSDoc Documentation Standards**: All code must be well-documented
  - Every file MUST have a `@fileoverview` header explaining its purpose
  - All exported functions MUST have JSDoc comments with:
    - Description of what the function does
    - `@param` tags for all parameters
    - `@returns` tag describing return value
    - `@throws` tag if function can throw errors
  - Complex logic should have inline comments explaining the "why"
  - Example:
    ```typescript
    /**
     * @fileoverview Brief description of module purpose
     * @module path/to/module
     */

    /**
     * Fetches user data from the database
     * @param userId - The unique user identifier
     * @returns User object with profile data
     * @throws Error if user not found
     */
    export async function getUser(userId: string): Promise<User> {
      // Implementation
    }
    ```

UI/UX Design Principles

**Content Width Consistency**: All pages must use consistent maximum width
  - Use `max-w-7xl mx-auto` for all page content containers
  - Use responsive padding: `px-4 sm:px-6 lg:px-8 py-8`
  - This ensures content aligns with the navbar width and maintains visual consistency
  - Applies to: Dashboard, Word Lists, Settings, and all other pages

**Sticky Navigation Elements**: Important navigation should remain visible
  - Settings sidebar uses `sticky top-20 self-start` to stay visible on scroll
  - Navbar is sticky with `sticky top-0` for consistent access to profile/settings

Debugging Helpers
Log Puzzle Generation
typescriptif (process.env.NODE_ENV === 'development') {
  console.group('🧩 Puzzle Generation');
  console.log('Words:', words.length);
  console.log('Grid size:', grid.size);
  console.log('Placements:', placements);
  console.log('Connectivity:', isConnected);
  console.groupEnd();
}
Visualize Grid in Console
typescriptfunction debugGrid(grid: Grid) {
  const visual = grid.cells.map(row => 
    row.map(cell => cell.letter || '⬛').join(' ')
  ).join('\n');
  console.log(visual);
}
Production Checklist
Before deploying to production:

 All tests passing
 Stripe webhook endpoint verified
 Rate limiting implemented
 CORS properly configured
 Database backups scheduled
 Error tracking (Sentry) configured
 Analytics (Plausible) implemented
 SSL certificate active
 Environment variables secured
 Database indexes optimized
 RLS policies tested
 Edge function cold starts optimized

Common SQL Queries
sql-- Get today's due words for user
SELECT w.*, wp.repetition_level
FROM words w
JOIN word_progress wp ON w.id = wp.word_id
WHERE wp.user_id = $1 
  AND wp.next_review_date <= CURRENT_DATE
ORDER BY wp.next_review_date;

-- Update word progress after review
UPDATE word_progress
SET 
  repetition_level = CASE 
    WHEN $2 = 'perfect' THEN LEAST(repetition_level + 1, 6)
    WHEN $2 = 'unknown' THEN 0
    ELSE repetition_level
  END,
  next_review_date = CURRENT_DATE + INTERVAL '1 day' * 
    (ARRAY[1,3,7,14,30,90,180])[repetition_level + 1],
  last_reviewed_at = NOW(),
  total_reviews = total_reviews + 1,
  correct_reviews = correct_reviews + 
    CASE WHEN $2 IN ('perfect', 'half_known') THEN 1 ELSE 0 END
WHERE user_id = $1 AND word_id = $3;
External Resources

Supabase RLS Guide
Stripe Subscription Webhooks
React Query Patterns
Crossword Generation Papers

Contact & Support

GitHub Issues: [repo]/issues
Documentation: [repo]/wiki
Developer: David (ChromeOS/Crostini environment)
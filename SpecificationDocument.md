# EDU-PUZZLE: Technical Specification Document v1.0

## 1. Executive Summary

### 1.1 Product Overview
EDU-PUZZLE is a desktop-first vocabulary learning web app that combines Spaced Repetition Learning with crossword puzzle gamification. Users maintain vocabulary lists and solve automatically generated crossword puzzles, while an intelligent algorithm determines the optimal repetition time for each vocabulary word.

### 1.2 Unique Selling Propositions
* **Gamified Spaced Repetition** through crossword puzzle mechanics.
* **Intelligent puzzle generation** with no islands or disconnected clusters.
* **Scientifically-backed learning system** with adaptive intervals.
* **Minimal puzzle count** through optimal word grouping.

### 1.3 Monetization
* 7-day free trial (full functionality).
* Subsequently subscription-only: **€6.99/month**.
* No freemium model.

---

## 2. Technical Architecture

### 2.1 Technology Stack

```yaml
Frontend:
  Framework: React 18.x with Vite 5.x
  Language: TypeScript 5.x
  Styling: TailwindCSS 3.x + shadcn/ui
  State: Zustand + React Query
  Routing: React Router 6.x
  Build: Vite

Backend:
  Database: Supabase (PostgreSQL)
  Auth: Supabase Auth
  Functions: Supabase Edge Functions (Deno)
  Storage: Supabase Storage (for exports)

Payments:
  Provider: Stripe
  Webhooks: Stripe → Supabase Edge Functions

Hosting:
  Frontend: Netlify (CDN)
  Backend: Supabase Cloud
  Domain: Namecheap/Cloudflare

Development:
  Version Control: Git + GitHub
  Package Manager: pnpm
  Linting: ESLint + Prettier
  Testing: Vitest + React Testing Library
2.2 Database Schema
SQL

-- Core Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'trial',
  subscription_end_date TIMESTAMP,
  trial_end_date TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES word_lists(id) ON DELETE CASCADE,
  term TEXT NOT NULL,       -- The word to be placed (e.g., "Apple")
  translation TEXT NOT NULL, -- The clue (e.g., "A fruit")
  definition TEXT,
  example_sentence TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  repetition_level INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMP,
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  UNIQUE(user_id, word_id)
);

CREATE TABLE puzzle_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID REFERENCES word_lists(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  puzzle_data JSONB NOT NULL, -- Grid, placed words, clues, etc.
  total_words INTEGER NOT NULL,
  correct_words INTEGER DEFAULT 0
);

CREATE TABLE word_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES puzzle_sessions(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id),
  user_id UUID REFERENCES users(id),
  review_type TEXT NOT NULL, -- 'perfect', 'half_known', 'conditional', 'unknown'
  time_to_solve INTEGER, -- in seconds
  hints_used INTEGER DEFAULT 0,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_word_progress_next_review ON word_progress(user_id, next_review_date);
CREATE INDEX idx_words_list ON words(list_id);
CREATE INDEX idx_puzzle_sessions_user ON puzzle_sessions(user_id, started_at DESC);
3. Core Features Specification
3.1 Crossword Puzzle Generation (Detailed Algorithm)
This section details the robust, multi-stage approach for puzzle generation.

3.1.1 Core Strategy: "Adaptive Cluster Generation"
TypeScript

// Main architecture interface
interface CrosswordSystem {
  // Phase 1: Analysis & Grouping
  analyzeWords(words: Word[]): WordAnalysis
  createOptimalClusters(analysis: WordAnalysis): WordCluster[]

  // Phase 2: Generation
  generatePuzzle(cluster: WordCluster): Puzzle | null

  // Phase 3: Validation
  ensureConnectivity(puzzle: Puzzle): boolean

  // Phase 4: Fallback
  handleFailure(remainingWords: Word[]): Puzzle[]
}
3.1.2 Phase 1: Intelligent Word Analysis
TypeScript

interface WordAnalysis {
  word: string
  difficulty: number      // 0-1 based on rare letters
  crossingPotential: Map<string, number>  // With other words
  optimalPartners: string[]  // Top 5 crossing partners
}

// Calculation of crossing potential
function calculateCrossingPotential(word1: string, word2: string): number {
  const letters1 = new Set(word1.split(''))
  const letters2 = new Set(word2.split(''))
  const common = intersection(letters1, letters2)

  // Weighting: Common letters (e,n,r) = 1 point, rare (x,y,q) = 3 points
  return Array.from(common).reduce((score, letter) => {
    return score + getLetterWeight(letter)
  }, 0)
}
3.1.3 Phase 2: The Generation Algorithm
Core Idea: Instead of backtracking, we use "Incremental Best-Fit" with a connectivity guarantee.

TypeScript

class PuzzleGenerator {
  generateWithGuarantee(words: Word[], timeLimit: number = 5000): Puzzle[] {
    const puzzles: Puzzle[] = []
    let remainingWords = [...words]

    while (remainingWords.length > 0) {
      // Optimally take 10-15 words
      const batch = this.selectOptimalBatch(remainingWords)

      // Multi-start approach: 3 parallel attempts
      const puzzle = this.multiStartGeneration(batch, timeLimit)

      if (puzzle.placedWords.length === batch.length) {
        // Success! All words placed
        puzzles.push(puzzle)
        remainingWords = remainingWords.filter(w => !batch.includes(w))
      } else {
        // Split difficult group further
        const placed = puzzle.placedWords.map(p => p.word)
        const unplaced = batch.filter(w => !placed.includes(w))

        puzzles.push(puzzle)  // Save partial puzzle
        remainingWords = [...remainingWords.filter(w => !placed.includes(w))]

        // Unplaced words get priority in the next round
        remainingWords.unshift(...unplaced)
      }
    }

    return puzzles
  }

  private placeWordIncremental(
    grid: Grid, 
    word: string, 
    placedWords: PlacedWord[]
  ): PlacementOption[] {
    const options: PlacementOption[] = []

    if (placedWords.length === 0) {
      // First word: Center of the grid
      return [{
        x: Math.floor(grid.size / 2),
        y: Math.floor(grid.size / 2),
        direction: 'horizontal',
        score: 1
      }]
    }

    // Find all possible crossing points
    for (const placed of placedWords) {
      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < placed.word.length; j++) {
          if (word[i] === placed.word[j]) {
            // Crossing found! Check if placeable
            const option = this.calculatePlacement(word, i, placed, j, grid)
            if (option && this.isValidPlacement(option, grid)) {
              option.score = this.scorePlacement(option, grid, placedWords)
              options.push(option)
            }
          }
        }
      }
    }

    // Sort by score (number of crossings, compactness, etc.)
    return options.sort((a, b) => b.score - a.score)
  }
}
3.1.4 Phase 3: Connectivity Guarantee
TypeScript

class ConnectivityChecker {
  isFullyConnected(puzzle: Puzzle): boolean {
    if (puzzle.placedWords.length <= 1) return true

    // Build adjacency graph
    const graph = new Map<string, Set<string>>()

    for (const word of puzzle.placedWords) {
      graph.set(word.id, new Set())
      for (const crossing of word.crossings) {
        graph.get(word.id)!.add(crossing.otherWordId)
      }
    }

    // DFS from the first word
    const visited = new Set<string>()
    const stack = [puzzle.placedWords[0].id]

    while (stack.length > 0) {
      const current = stack.pop()!
      if (visited.has(current)) continue

      visited.add(current)
      const neighbors = graph.get(current) || new Set()
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor)
        }
      }
    }

    return visited.size === puzzle.placedWords.length
  }
}
3.1.5 Phase 4: Speed Optimizations
TypeScript

class OptimizedGenerator {
  // 1. Letter Frequency Cache
  private letterFrequencyCache = new Map<string, number>()

  // 2. Template Library for common patterns
  private successfulPatterns = new Map<string, GridTemplate>()

  // 3. Parallel Processing
  async multiStartGeneration(words: Word[]): Promise<Puzzle> {
    const attempts = await Promise.race([
      this.attemptWithSeed(words, 'longest'),
      this.attemptWithSeed(words, 'mostCrossings'),
      this.attemptWithSeed(words, 'balanced'),
      this.timeout(3000)  // Time limit
    ])

    return this.selectBestAttempt(attempts)
  }

  // 4. Progressive Web Worker Generation
  generateInBackground(words: Word[]): Observable<Puzzle> {
    return new Observable(observer => {
      const worker = new Worker('puzzle-generator.worker.js')

      worker.postMessage({ words, config: this.config })

      worker.onmessage = (e) => {
        if (e.data.type === 'puzzle') {
          observer.next(e.data.puzzle)
        } else if (e.data.type === 'complete') {
          observer.complete()
        }
      }
    })
  }
}
3.1.6 Algorithmic Quality Metrics
TypeScript

interface PuzzleQuality {
  connectivity: number    // 1.0 = all connected
  density: number        // Filled cells / Total cells
  avgCrossings: number   // Average crossings per word
  symmetry: number       // Bonus for aesthetic arrangement

  getOverallScore(): number {
    return (
      this.connectivity * 1000 +  // Must be 1.0!
      this.density * 100 +
      this.avgCrossings * 50 +
      this.symmetry * 10
    )
  }
}
3.2 Spaced Repetition System
3.2.1 Interval Calculation
TypeScript

class SpacedRepetitionEngine {
  private intervals = [1, 3, 7, 14, 30, 90, 180]; // Days

  calculateNextReview(
    currentLevel: number,
    reviewType: ReviewType
  ): { level: number; daysUntilNext: number } {
    switch (reviewType) {
      case 'perfect':
      case 'half_known':
        // Move up one level
        const newLevel = Math.min(currentLevel + 1, this.intervals.length - 1);
        return {
          level: newLevel,
          daysUntilNext: this.intervals[newLevel]
        };

      case 'conditional':
        // Stay on the same level
        return {
          level: currentLevel,
          daysUntilNext: this.intervals[currentLevel]
        };

      case 'unknown':
        // Back to level 0
        return {
          level: 0,
          daysUntilNext: this.intervals[0]
        };
    }
  }
}
3.2.2 Rating Criteria
TypeScript

interface ReviewCriteria {
  determineReviewType(params: {
    wasCorrectAtCheck: boolean;
    wasCorrectAtSubmit: boolean;
    percentageRevealed: number;
    timeToSolve: number;
  }): ReviewType {
    // >70% revealed = cannot be rated
    if (params.percentageRevealed > 70) {
      return 'not_evaluated';
    }

    // Incorrect at submit = unknown
    if (!params.wasCorrectAtSubmit) {
      return 'unknown';
    }

    // 30-70% revealed = conditionally known
    if (params.percentageRevealed >= 30) {
      return 'conditional';
    }

    // Check incorrect, Submit correct = half known
    if (!params.wasCorrectAtCheck && params.wasCorrectAtSubmit) {
      return 'half_known';
    }

    // Correct immediately = perfect
    return 'perfect';
  }
}
3.3 User Interface Components

3.3.0 UI/UX Design Principles
All pages must follow these consistency guidelines:

**Content Width Consistency**
- All page content must use `max-w-7xl mx-auto` as the container width
- Apply responsive padding: `px-4 sm:px-6 lg:px-8 py-8`
- This ensures content aligns perfectly with the navbar and maintains visual consistency
- Applies to all pages: Dashboard, Word Lists, Settings, Puzzle Solver, etc.

**Sticky Navigation**
- Main navbar: `sticky top-0` for persistent access to profile menu and branding
- Settings sidebar: `sticky top-20 self-start` to remain visible during scroll
- Ensures important navigation is always accessible without scrolling back up

**Layout Pattern**
```tsx
<AppLayout>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content here */}
  </div>
</AppLayout>
```

3.3.1 Main Views
TypeScript

// Routing structure
const routes = {
  '/': 'LandingPage',
  '/app': 'Dashboard',
  '/app/lists': 'WordListsOverview',
  '/app/lists/:id': 'WordListDetail',
  '/app/puzzle/:sessionId': 'PuzzleSolver',
  '/app/review': 'DailyReview',
  '/app/stats': 'Statistics',
  '/settings': 'UserSettings',
  '/subscription': 'SubscriptionManagement'
};
3.3.2 Puzzle-Solver Interface
TypeScript

interface PuzzleSolverUI {
  // Grid representation
  grid: {
    cellSize: 40; // px
    fontSize: 20; // px
    showNumbers: true;
    highlightCurrentWord: true;
    showErrors: boolean; // After check
  };

  // Interaction
  controls: {
    checkPuzzle: () => void;    // Shows errors
    submitPuzzle: () => void;    // Finishes and grades
    revealLetter: () => void;    // Hint system
    skipWord: () => void;        // Next word
  };

  // Clues
  clues: {
    across: Clue[];
    down: Clue[];
    currentClue: Clue | null;
  };

  // Progress
  progress: {
    wordsCompleted: number;
    totalWords: number;
    hintsUsed: number;
    timeElapsed: number; // seconds
  };
}
3.4 Payment Integration
3.4.1 Stripe Webhook Handler
TypeScript

// Supabase Edge Function
async function handleStripeWebhook(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    signature,
    STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'checkout.session.completed':
      // Trial → Active
      await updateUserSubscription(
        event.data.object.client_reference_id, // This should be the user_id
        'active',
        event.data.object.subscription
      );
      break;
      
    case 'customer.subscription.deleted':
      // Subscription cancelled
      await updateUserSubscription(
        event.data.object.customer, // This is the stripe_customer_id
        'cancelled'
      );
      break;
  }
}
4. API Endpoints
4.1 Supabase Edge Functions
TypeScript

// /functions/generate-puzzle
export async function handler(req: Request) {
  const { userId, listId } = await req.json();

  // 1. Get due words
  const dueWords = await getDueWords(userId, listId);

  // 2. Split into groups
  const clusters = clusterWords(dueWords);

  // 3. Generate puzzles
  const puzzles = await Promise.all(
    clusters.map(cluster => generatePuzzle(cluster))
  );

  // 4. Create sessions
  const sessions = await createPuzzleSessions(userId, puzzles);

  return new Response(JSON.stringify({ sessions }));
}

// /functions/submit-review
export async function handler(req: Request) {
  const { sessionId, wordReviews } = await req.json();

  // 1. Save reviews
  await saveWordReviews(wordReviews);

  // 2. Update progress
  for (const review of wordReviews) {
    await updateWordProgress(review.wordId, review.reviewType);
  }

  // 3. Complete session
  await completePuzzleSession(sessionId);

  return new Response(JSON.stringify({ success: true }));
}
5. Development Roadmap
Phase 1: Foundation (Weeks 1-3)
Goal: Technical basis and core functionality

Week 1: Setup & Base Architecture

Project setup (Vite, React, TypeScript, Tailwind)

Create Supabase project & implement schema

Auth system (Registration, Login, Trial logic)

Base routing and layout components

GitHub repo & CI/CD setup

Week 2: Data Management

Word List CRUD operations

Word CRUD with validation

Basic Import/Export (JSON format)

RLS (Row Level Security) policies

React Query integration

Week 3: Crossword Core

Implement Grid data structure

Basic placement algorithm

Connectivity validator

First visual grid component

Simple test UI for generation

Phase 2: Puzzle Generation (Weeks 4-6)
Goal: Robust generation algorithm

Week 4: Algorithm Refinement

Word clustering system

Multi-start generation

Performance optimizations

Edge-case handling

Unit tests for algorithm

Week 5: Puzzle Solver UI

Interactive grid component

Keyboard navigation

Clue display & selection

Check & Submit functionality

Hint system

Week 6: Spaced Repetition

Implement SRS engine

Review Type Determination

Progress tracking

Due words calculation

Daily Review Dashboard

Phase 3: User Experience (Weeks 7-8)
Goal: Polished user interface

Week 7: UI Polish

Responsive design adjustments

Animations & transitions

Error handling & loading states

Keyboard shortcuts

Dark Mode (optional)

Week 8: User Features

Statistics dashboard

Learning progress visualization

Achievements/Gamification elements

User settings

Help/Tutorial

Phase 4: Monetization & Launch (Weeks 9-10)
Goal: Payment integration and launch preparation

Week 9: Payment System

Stripe account & setup

Checkout flow

Webhook handler

Subscription management UI

Trial end handling

Email notifications

Week 10: Launch Preparation

Performance optimization

Security audit

Backup strategy

Landing page

SEO optimization

Analytics integration

Beta testing

Bug fixes

6. Quality Metrics
6.1 Performance KPIs
YAML

Puzzle Generation:
  - Time: < 3 seconds for 15 words
  - Success Rate: 100% (even if it means multiple puzzles)
  - Connectivity: 100% connected

User Experience:
  - First Contentful Paint: < 1.5s
  - Time to Interactive: < 3s
  - Lighthouse Score: > 90

Business Metrics:
  - Trial → Paid Conversion: Target 15%
  - Monthly Churn: < 10%
  - User Engagement: 5+ puzzles/week
6.2 Testing Strategy
TypeScript

// Unit Tests: Algorithm logic
describe('PuzzleGenerator', () => {
  test('generates connected puzzle', () => {})
  test('handles edge cases', () => {})
  test('performance under load', () => {})
});

// Integration Tests: API & DB
describe('API Endpoints', () => {
  test('generate puzzle flow', () => {})
  test('submit review flow', () => {})
});

// E2E Tests: User Journeys
describe('User Flow', () => {
  test('complete puzzle solving', () => {})
  test('subscription purchase', () => {})
});
7. Deployment Architecture
YAML

Production:
  Frontend:
    - Host: Netlify
    - CDN: Cloudflare
    - Domain: edu-puzzle.com
  Backend:
    - Database: Supabase (Frankfurt Region)
    - Edge Functions: Supabase
    - File Storage: Supabase Storage
  Monitoring:
    - Error Tracking: Sentry
    - Analytics: Plausible
    - Uptime: Better Uptime

Development:
  - Local: Docker Compose Setup
  - Staging: Netlify Preview Deployments
  - Database: Supabase Branch
8. Risk Mitigation
8.1 Technical Risks
Algorithm too slow: Pre-generation in the background.

Too many words: Automatic batching.

DB Overload: Caching layer, read replicas.

No crossings possible: Fallback to multiple choice for those words.

8.2 Business Risks
Low Conversion: A/B testing different trial lengths.

High Churn Rate: Engagement emails, achievements.

Competition: Focus on unique features, better UX.
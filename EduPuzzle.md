# EduPuzzle - Comprehensive Application Documentation

This document provides a complete overview of the EduPuzzle application architecture, technology stack, data flows, and core functionality. It is designed to help developers understand the codebase at a fundamental level and work effectively with the system.

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Routes and Pages](#routes-and-pages)
5. [State Management](#state-management)
6. [Database Schema](#database-schema)
7. [API Design](#api-design)
8. [Core Algorithms](#core-algorithms)
9. [Authentication & Subscription Flow](#authentication--subscription-flow)
10. [Data Flows](#data-flows)
11. [Edge Functions](#edge-functions)
12. [Error Handling & Security](#error-handling--security)
13. [Key Hooks](#key-hooks)
14. [File Structure](#file-structure)

---

## Application Overview

**EduPuzzle** is a vocabulary learning platform that combines:

- **Spaced Repetition Learning (SRS)**: Scientifically-backed intervals for optimal retention
- **Crossword Puzzle Gamification**: Interactive puzzles that make learning engaging
- **Smart Puzzle Generation**: Automatically generates connected crossword puzzles from vocabulary words
- **Social Features**: Learn buddy system and list sharing (static copies and collaborative lists)
- **Subscription Model**: 7-day free trial, then €6.99/month via Stripe

### Key Features

- 🧩 Intelligent crossword generation with no disconnected clusters
- 📚 Create, edit, and manage custom vocabulary lists
- 🔄 Spaced Repetition System using SuperMemo SM-2 algorithm
- 🤝 Share vocabulary lists (static copy or collaborative real-time sync)
- 💳 Stripe subscription with JWT-based access control
- 📊 Progress tracking, streaks, and learning analytics
- 🤖 Learning buddy system for mutual accountability
- ⚡ Web Worker puzzle generation for non-blocking UI

---

## Technology Stack

### Frontend

- **React 18**: UI library with hooks and functional components
- **TypeScript 5**: Type-safe JavaScript
- **Vite 5**: Fast build tool and development server
- **TailwindCSS 3.x**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible UI components
- **React Query (@tanstack/react-query)**: Server state management with caching
- **Zustand**: Lightweight client state management
- **React Router**: Client-side routing
- **Vitest + React Testing Library**: Unit and integration testing

### Backend

- **Supabase**: Backend-as-a-Service
  - **PostgreSQL**: Relational database
  - **Supabase Auth**: JWT-based authentication with social providers
  - **Edge Functions**: Server-side TypeScript/Deno functions
  - **Real-time Subscriptions**: WebSocket-based live data updates

### Payments & Monitoring

- **Stripe**: Payment processing and subscription management
- **Sentry**: Error tracking and performance monitoring

### Development Tools

- **ESLint**: Code quality
- **Prettier**: Code formatting
- **pnpm**: Package management

---

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                         │
│  (Pages, Components, Hooks, State Management with React Query)  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/WebSocket
          ┌────────────┴────────────┐
          │                         │
    ┌─────▼──────┐          ┌──────▼─────┐
    │  Edge      │          │  Supabase  │
    │  Functions │          │  Database  │
    │ (Deno/TS)  │          │ (PostgreSQL)
    └─────┬──────┘          └──────┬─────┘
          │ Calls                  │
    ┌─────▼──────────────┐         │
    │ Puzzle Generation  │         │
    │ Stripe Webhooks    │         │
    │ Auth Setup         │         │
    └────────────────────┘         │
                                   │
                        ┌──────────▼────────┐
                        │  Stripe API       │
                        │  (Subscriptions)  │
                        └───────────────────┘
```

### Key Architectural Patterns

1. **Client-Server Separation**: Frontend is fully decoupled from backend
2. **BaaS Model**: Supabase provides auth, database, and functions
3. **JWT-First Subscription**: Subscription data stored in JWT tokens for instant access
4. **Server-Side Puzzle Generation**: Expensive computation moved to Edge Functions
5. **React Query Dominance**: Consistent server state management
6. **Row Level Security (RLS)**: Database-level access control
7. **Type Safety**: End-to-end TypeScript with generated types from database schema

---

## Routes and Pages

### Public Routes

| Route                  | Component         | Purpose                                                     |
| ---------------------- | ----------------- | ----------------------------------------------------------- |
| `/`                    | `LandingPage.tsx` | Marketing landing page                                      |
| `/login`               | `LoginPage.tsx`   | User authentication                                         |
| `/signup`              | `SignupPage.tsx`  | User registration                                           |
| `/shared/:token`       | `SharedList.tsx`  | Access shared vocabulary lists (anonymous or authenticated) |
| `/buddy/accept/:token` | `BuddyAccept.tsx` | Accept learning buddy invitations                           |

### Protected Routes (require authentication)

| Route                    | Component                  | Purpose                                                  |
| ------------------------ | -------------------------- | -------------------------------------------------------- |
| `/app/dashboard`         | `Dashboard.tsx`            | Main hub (word lists, streak, buddy widget, performance) |
| `/app/todays-puzzles`    | `TodaysPuzzles.tsx`        | Daily practice with SRS-based puzzles                    |
| `/app/lists/:id`         | `WordListDetail.tsx`       | Manage words in a specific list (CRUD)                   |
| `/app/puzzle/:listId`    | `PuzzleSolver.tsx`         | Solve crossword puzzle for a list                        |
| `/settings/account`      | `AccountSettings.tsx`      | Account management                                       |
| `/settings/subscription` | `SubscriptionSettings.tsx` | Subscription management                                  |
| `/settings/buddy`        | `Buddy.tsx`                | Configure learning buddy settings                        |
| `/settings/stats`        | `PerformanceStats.tsx`     | View learning analytics                                  |

### Subscription Flow Routes

| Route                   | Component                 | Purpose                        |
| ----------------------- | ------------------------- | ------------------------------ |
| `/subscription/success` | `SubscriptionSuccess.tsx` | Post-payment success page      |
| `/subscription/cancel`  | `SubscriptionCancel.tsx`  | Subscription cancellation page |

---

## State Management

### React Query (Server State)

React Query is the primary state management solution for server-fetched data.

**Configuration:**

- Stale time: 5 minutes
- Cache time: 10 minutes
- Retry: 1 automatic retry on failure

**Main Query Hooks:**

```typescript
// Word lists
useWordLists() // Fetch user's word lists
useWordList(id) // Fetch single list
useWords(listId) // Fetch words in a list
useTodaysPuzzles() // Fetch daily puzzles (SRS-based)

// Subscription & auth
useSubscription() // Check subscription status (deprecated)
useAuth() // User auth state and session

// Social features
useBuddy() // Learning buddy information
useLeaderboard(listId) // Leaderboard for shared lists

// Performance
usePerformanceInsights() // Learning analytics
useStreak() // User streak information

// Sharing
useSharedLists() // Lists user has access to
useCollaborativeLists() // Collaborative lists in real-time
```

**Mutation Patterns:**

```typescript
// Optimistic updates
const mutation = useMutation({
  mutationFn: updateWord,
  onMutate: (newData) => {
    // Optimistically update cache
    queryClient.setQueryData(['words', listId], (old) => [...old, newData])
    return { previousData }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['words', listId], context.previousData)
  },
})
```

### Zustand (Client State)

Used minimally for UI state that doesn't require server persistence:

- Dialog open/close states
- Form input states
- Temporary UI preferences

Example:

```typescript
// Not heavily used; most state is in React Query
```

### Authentication State

Managed in `useAuth()` hook from `src/hooks/useAuth.ts`:

```typescript
interface AuthState {
  user: User | null
  loading: boolean
  hasAccess: boolean // Derived from JWT app_metadata
  subscriptionStatus: string
  subscription: {
    status: 'trial' | 'active' | 'cancelled' | 'expired' | 'none'
    trialEndDate?: string
    subscriptionEndDate?: string
  }
}
```

- **JWT Storage**: Authorization token stored in browser's secure storage
- **Real-time Listeners**: Supabase auth state changes trigger updates
- **Subscription Metadata**: Stored in JWT `app_metadata` for instant access without DB queries

---

## Database Schema

### Core Tables

#### `users`

Stores user accounts and subscription metadata.

```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
name            TEXT NOT NULL
created_at      TIMESTAMPTZ DEFAULT NOW()
stripe_customer_id      TEXT UNIQUE
stripe_subscription_id  TEXT UNIQUE
subscription_status     TEXT
subscription_end_date   TIMESTAMPTZ
trial_end_date          TIMESTAMPTZ
```

**Purpose**: User identity and subscription tracking
**Access**: Row Level Security - users can only see their own row

---

#### `word_lists`

Vocabulary collections created by users.

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id) ON DELETE CASCADE
name                TEXT NOT NULL
source_language     TEXT NOT NULL
target_language     TEXT NOT NULL
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
is_collaborative    BOOLEAN DEFAULT FALSE
```

**Purpose**: Organize vocabulary by language pair and context
**Features**: Can be shared as static copies or collaborative lists
**Access**: RLS - users can only see/edit their own lists

---

#### `words`

Individual vocabulary items.

```sql
id                  UUID PRIMARY KEY
list_id             UUID REFERENCES word_lists(id) ON DELETE CASCADE
term                TEXT NOT NULL
translation         TEXT NOT NULL
definition          TEXT
example_sentence    TEXT
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Purpose**: Store vocabulary words with definitions and examples
**Access**: RLS - users can only see words from their lists or shared lists

---

#### `word_progress`

Spaced Repetition System (SRS) tracking per user/word.

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id) ON DELETE CASCADE
word_id             UUID REFERENCES words(id) ON DELETE CASCADE
stage               INTEGER DEFAULT 0      -- 0-6 (New to Master)
ease_factor         DECIMAL DEFAULT 2.5    -- SuperMemo SM-2
interval_days       INTEGER DEFAULT 1
next_review_date    DATE
last_reviewed_at    TIMESTAMPTZ
total_reviews       INTEGER DEFAULT 0
correct_reviews     INTEGER DEFAULT 0
incorrect_reviews   INTEGER DEFAULT 0
current_streak      INTEGER DEFAULT 0
updated_at          TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, word_id)
```

**Purpose**: Track learning progress using SM-2 algorithm
**Stages**:

- 0: New (not yet reviewed)
- 1: Learning (initial memorization)
- 2: Young (early retention)
- 3: Mature (stable retention)
- 4: Relearning (forgotten word being re-learned)
- 5: Expert (high confidence)
- 6: Master (ultimate retention)

**Access**: RLS - users can only see their own progress

---

#### `puzzle_sessions`

Records of completed puzzle-solving sessions.

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id) ON DELETE CASCADE
list_id             UUID REFERENCES word_lists(id) ON DELETE CASCADE
puzzle_data         JSONB               -- Full puzzle grid data
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
correct_words       INTEGER
total_words         INTEGER
```

**Purpose**: Track puzzle-solving history and performance
**Data**: Contains full puzzle grid for replay functionality
**Access**: RLS - users can only see their own sessions

---

#### `word_reviews`

Individual word performance within a puzzle session.

```sql
id                  UUID PRIMARY KEY
session_id          UUID REFERENCES puzzle_sessions(id) ON DELETE CASCADE
word_id             UUID REFERENCES words(id) ON DELETE CASCADE
user_answer         TEXT
correct_answer      TEXT
review_type         TEXT              -- 'perfect', 'half_known', 'conditional', 'unknown', 'not_evaluated'
time_spent_ms       INTEGER
updated_at          TIMESTAMPTZ
```

**Purpose**: Detailed word performance tracking
**Review Types**:

- **Perfect**: Correctly answered immediately → advance level
- **Half Known**: Correctly answered after hints → advance level
- **Conditional**: 30-70% revealed → same level
- **Unknown**: Incorrectly answered → reset to level 0
- **Not Evaluated**: >70% revealed → no change

---

#### `shared_lists`

Metadata for shared vocabulary lists.

```sql
id                  UUID PRIMARY KEY
original_list_id    UUID REFERENCES word_lists(id)
created_by          UUID REFERENCES users(id)
share_token         TEXT UNIQUE NOT NULL
share_mode          TEXT NOT NULL      -- 'copy' or 'collaborative'
created_at          TIMESTAMPTZ DEFAULT NOW()
is_active           BOOLEAN DEFAULT TRUE
expires_at          TIMESTAMPTZ
access_count        INTEGER DEFAULT 0
last_accessed_at    TIMESTAMPTZ
```

**Purpose**: Manage shared vocabulary list access and permissions
**Share Modes**:

- **copy**: Recipients get independent copy, SRS progress separate
- **collaborative**: Multiple users edit same list, real-time sync, individual SRS progress

---

#### `list_collaborators`

Users who have joined collaborative lists.

```sql
id                  UUID PRIMARY KEY
shared_list_id      UUID REFERENCES shared_lists(id)
user_id             UUID REFERENCES users(id)
role                TEXT               -- 'owner', 'contributor', 'viewer'
joined_at           TIMESTAMPTZ DEFAULT NOW()
leaderboard_opted_in BOOLEAN DEFAULT FALSE
cached_score        INTEGER
score_updated_at    TIMESTAMPTZ
```

**Purpose**: Manage collaborator access and roles
**Features**: Leaderboard scoring for friendly competition

---

#### `buddies`

Learning buddy relationships.

```sql
id                  UUID PRIMARY KEY
user1_id            UUID REFERENCES users(id)
user2_id            UUID REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT NOW()
```

**Purpose**: Connect learning buddy pairs

---

#### `buddy_invites`

Pending buddy invitation tokens.

```sql
id                  UUID PRIMARY KEY
inviter_id          UUID REFERENCES users(id)
invite_token        TEXT UNIQUE NOT NULL
expires_at          TIMESTAMPTZ NOT NULL
is_active           BOOLEAN DEFAULT TRUE
used_at             TIMESTAMPTZ
used_by             UUID
created_at          TIMESTAMPTZ DEFAULT NOW()
```

**Purpose**: Manage buddy invitation lifecycle

---

#### `user_streaks`

Daily practice streaks (motivation tracking).

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id) UNIQUE
current_streak      INTEGER DEFAULT 0
longest_streak      INTEGER DEFAULT 0
last_streak_update  DATE
streak_freezes_available INTEGER DEFAULT 0
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Purpose**: Track consecutive daily practice
**Features**: Streak freezes allow missing one day without breaking streak

---

#### `daily_completions`

Daily practice completion tracking.

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
completion_date     DATE NOT NULL
due_words_count     INTEGER DEFAULT 0
words_completed     INTEGER DEFAULT 0
puzzles_completed   INTEGER DEFAULT 0
freeze_used         BOOLEAN DEFAULT FALSE
streak_maintained   BOOLEAN DEFAULT FALSE
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, completion_date)
```

**Purpose**: Daily practice metrics and streak maintenance

---

#### `puzzle_cache`

Caches generated puzzles for 24 hours to ensure consistency.

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
puzzle_data         JSONB NOT NULL
word_ids            TEXT[] NOT NULL
generated_at        TIMESTAMPTZ DEFAULT NOW()
valid_until         TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
```

**Purpose**: Avoid regenerating same puzzle within 24 hours
**Benefit**: Consistent puzzle + server performance optimization

---

#### `stripe_webhook_events`

Audit log for Stripe webhook processing (idempotency).

```sql
id                  UUID PRIMARY KEY
event_id            TEXT UNIQUE NOT NULL
event_type          TEXT NOT NULL
customer_id         TEXT
subscription_id     TEXT
user_id             UUID REFERENCES users(id)
processed_at        TIMESTAMPTZ
created_at          TIMESTAMPTZ DEFAULT NOW()
```

**Purpose**: Prevent duplicate webhook processing
**Feature**: Idempotency for safe retry logic

---

### Row Level Security (RLS) Policies

All tables implement RLS to ensure users only access their own data:

```sql
-- Example: users can only see their own word lists
CREATE POLICY "Users see own lists"
  ON word_lists FOR SELECT
  USING (auth.uid() = user_id)
```

Key principles:

- Users can only see data where `user_id` matches their own
- Shared lists bypass RLS via special policies
- Admin operations use service role bypass

---

## API Design

### Client-Side API Layer (`src/lib/api/`)

The API layer provides type-safe, error-handled functions for database operations.

#### `wordLists.ts`

```typescript
// Fetch all user's word lists (optionally with word counts)
getWordLists(params?: { withCounts?: boolean }): Promise<WordList[]>

// Fetch single word list
getWordList(id: string): Promise<WordList>

// Create new word list
createWordList(data: { name, source_language, target_language }): Promise<WordList>

// Update word list metadata
updateWordList(id: string, updates): Promise<WordList>

// Delete word list and all related data
deleteWordList(id: string): Promise<void>
```

**Features**:

- Optimistic updates with React Query
- Automatic cache invalidation
- Error handling and user feedback

---

#### `words.ts`

```typescript
// Fetch all words in a list
getWords(listId: string): Promise<Word[]>

// Create new word
createWord(listId: string, data): Promise<Word>

// Update word details
updateWord(listId: string, wordId: string, updates): Promise<Word>

// Delete word
deleteWord(listId: string, wordId: string): Promise<void>
```

---

#### `srs.ts` (Spaced Repetition)

```typescript
// Fetch all words due for review today
fetchDueWords(userId: string): Promise<WordWithProgress[]>

// Get words due for specific list
getListDueWords(userId: string, listId: string): Promise<WordWithProgress[]>

// Record word review result
recordReview(wordId: string, reviewType: ReviewType): Promise<void>

// Get detailed progress for word
getWordProgress(wordId: string): Promise<WordProgress>

// Bulk update progress (after puzzle session)
bulkUpdateProgress(reviews: ReviewData[]): Promise<void>

// Count due words (optimized query)
countDueWords(userId: string): Promise<number>
```

**Review Types**:

```typescript
type ReviewType =
  | 'perfect' // Correct immediately
  | 'half_known' // Correct after hints
  | 'conditional' // 30-70% revealed
  | 'unknown' // Incorrect
  | 'not_evaluated' // >70% revealed (no change)
```

---

#### `puzzles.ts`

```typescript
// Generate puzzles from words (calls Edge Function)
generatePuzzles(words: WordWithProgress[]): Promise<Puzzle[]>

// Get today's puzzles with caching
getTodaysPuzzles(): Promise<{ puzzles: Puzzle[], totalWords: number, cached?: boolean }>

// Save puzzle session completion
savePuzzleSession(data: PuzzleSessionData): Promise<void>

// Get puzzle history
getPuzzleHistory(limit?: number): Promise<PuzzleSession[]>
```

---

#### `sharedLists.ts`

```typescript
// Create shareable link for list
createShareLink(listId: string, mode: 'copy' | 'collaborative'): Promise<ShareToken>

// Access shared list with token
accessSharedList(token: string): Promise<SharedListData>

// Copy shared list to own account
copySharedList(token: string): Promise<WordList>

// Join collaborative list
joinCollaborativeList(token: string): Promise<void>

// Get list of collaborative lists user belongs to
getCollaborativeLists(): Promise<SharedList[]>

// Get leaderboard for collaborative list
getCollaborativeLeaderboard(listId: string): Promise<LeaderboardEntry[]>
```

---

#### `buddy.ts`

```typescript
// Create buddy invitation link
createBuddyInvite(): Promise<{ token: string, expiresAt: string }>

// Accept buddy invitation
acceptBuddyInvite(token: string): Promise<void>

// Get current buddy information
getBuddy(): Promise<BuddyInfo | null>

// Remove buddy relationship
removeBuddy(): Promise<void>
```

---

#### `stripe.ts`

```typescript
// Create Stripe checkout session
createCheckoutSession(): Promise<{ url: string }>

// Create Stripe customer portal session
createPortalSession(): Promise<{ url: string }>

// Check subscription status
checkSubscription(): Promise<{ status: SubscriptionStatus }>

// Manual subscription refresh (calls Edge Function)
refreshSubscription(): Promise<void>
```

---

#### `streak.ts`

```typescript
// Get user's current streak information
getStreakInfo(): Promise<StreakInfo>

// Record daily completion
recordDailyCompletion(data: CompletionData): Promise<void>

// Use a streak freeze
useStreakFreeze(): Promise<void>
```

---

#### `leaderboard.ts`

```typescript
// Get leaderboard for public lists
getPublicLeaderboard(listId: string): Promise<LeaderboardEntry[]>

// Get leaderboard for collaborative list
getCollaborativeLeaderboard(listId: string): Promise<LeaderboardEntry[]>

// Update user's leaderboard score
updateLeaderboardScore(listId: string, score: number): Promise<void>
```

---

#### `performance.ts`

```typescript
// Get overall learning performance
getPerformanceInsights(): Promise<PerformanceMetrics>

// Get words by stage distribution
getStageDistribution(): Promise<StageStats>

// Get weakest words (most often incorrect)
getWeakestWords(limit?: number): Promise<Word[]>

// Get best learning time analysis
getBestLearningTime(): Promise<TimeSlotAnalysis>

// Get weekly activity chart data
getWeeklyActivity(): Promise<ActivityData[]>
```

---

### Error Handling Pattern

All API functions follow a standardized error handling pattern:

```typescript
async function fetchData() {
  try {
    const { data, error } = await supabase.from('table').select()
    if (error) throw error
    return data
  } catch (error) {
    logger.error('Operation failed', { error, context: 'user-friendly' })
    throw new APIError('User-friendly message', error.code, error)
  }
}
```

---

## Core Algorithms

### 1. Crossword Puzzle Generation

**Location**: `src/lib/algorithms/`

**Architecture**: Multi-file modular system with clear separation of concerns.

#### Generator (`generator.ts`)

Main orchestrator that coordinates puzzle generation.

```typescript
async function generatePuzzles(words: Word[]): Promise<Puzzle[]>
```

**Algorithm**:

1. **Clustering**: Group words by letter overlap (`clustering.ts`)
2. **Puzzle Generation Loop**:
   - For each cluster:
     - Sort words by length (longest first)
     - Place longest word in center of grid
     - Iteratively place remaining words at crossing points
     - Validate connectivity and grid constraints
     - If all words fit → return puzzle; else split and create new puzzle
3. **Timeout**: 5-second generation limit to prevent timeouts

**Key Constraints**:

- 100% word coverage (all words must be included)
- Grid size: 16x16 maximum
- No disconnected islands (fully connected graph)
- Deterministic with seed for consistency

---

#### Clustering (`clustering.ts`)

Groups compatible words based on shared letters.

```typescript
function clusterWords(words: Word[]): Word[][]
```

**Process**:

1. Build letter-occurrence map for each word
2. Group words with letter overlap (threshold-based)
3. Return list of word clusters

**Benefit**: Reduces search space for faster placement

---

#### Placement (`placement.ts`)

Finds optimal crossing points for word placement.

```typescript
function placeWord(word: Word, grid: Grid, placedWords: PlacedWord[]): PlacedWord | null
```

**Strategy**:

1. For each letter in target word:
   - Find all matching positions on grid
   - Score each position based on:
     - Number of crossings (more = better)
     - Grid density (fills empty space)
     - Letter rarity (common letters easier to cross)
2. Place at highest-scoring position
3. Validate no overlaps (except intentional crosses)

---

#### Scoring (`scoring.ts`)

Evaluates placement quality.

```typescript
function scorePosition(
  word: Word,
  position: GridPosition,
  grid: Grid,
  placedWords: PlacedWord[]
): number
```

**Scoring Factors**:

- **Crossing Count**: Number of letter intersections (weighted heavily)
- **Grid Density**: Percentage of filled cells (balanced)
- **Letter Frequency**: Difficulty of filling crosses (rare letters = bonus)
- **Symmetry**: Grid balance (minor weight)
- **Bounding Box**: Compact placement (minor weight)

---

#### Connectivity (`connectivity.ts`)

Validates that all words form one connected graph.

```typescript
function validateConnectivity(placedWords: PlacedWord[], grid: Grid): boolean
```

**Algorithm**:

1. Build adjacency graph from placed words
2. Run breadth-first search from first word
3. Check if all words are reachable
4. If disconnected → return false; else true

**Importance**: Ensures solvable puzzle with clear flow

---

### 2. Spaced Repetition System (SRS)

**Location**: `src/lib/api/srs.ts` and `supabase/functions/`

**Algorithm**: SuperMemo SM-2 (1991), modified for vocabulary learning.

#### SM-2 Algorithm Overview

```
Quality: 0-5 scale
- 0-2: Incorrect or barely remembered
- 3-4: Correct but with effort
- 5: Perfect response

Formula:
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  where EF = ease factor, q = quality (0-5)

Interval = Previous_Interval * EF (for first review = 1 day)
```

#### Stages in EduPuzzle

```
Stage 0: NEW
  - Not yet reviewed
  - Next interval: 1 day

Stage 1: LEARNING
  - Initial memorization phase
  - Next interval: 3 days

Stage 2: YOUNG
  - Early retention phase
  - Next interval: 7 days

Stage 3: MATURE
  - Stable retention
  - Next interval: 14 days

Stage 4: RELEARNING
  - Forgotten word being re-learned
  - Triggered by incorrect answer from higher stage
  - Next interval: 30 days

Stage 5: EXPERT
  - High confidence retention
  - Next interval: 90 days

Stage 6: MASTER
  - Ultimate retention (rare)
  - Next interval: 180 days
```

#### Review Type Effects

Based on `word_reviews.review_type`:

| Review Type       | Effect                     | Ease Factor |
| ----------------- | -------------------------- | ----------- |
| **perfect**       | Advance one stage          | +0.2        |
| **half_known**    | Advance one stage (slower) | +0.1        |
| **conditional**   | Stay same stage            | -0.1        |
| **unknown**       | Reset to stage 0           | -0.5        |
| **not_evaluated** | No change                  | No change   |

**How Review Type is Determined**:

```typescript
function determineReviewType(
  userAnswer: string,
  correctAnswer: string,
  percentRevealed: number
): ReviewType {
  if (percentRevealed > 0.7) return 'not_evaluated'
  if (userAnswer === correctAnswer) {
    return percentRevealed > 0.3 ? 'perfect' : 'half_known'
  }
  if (percentRevealed >= 0.3 && percentRevealed <= 0.7) {
    return 'conditional'
  }
  return 'unknown'
}
```

#### Fetching Due Words

Due words are determined by `word_progress.next_review_date <= today`:

```typescript
async function fetchDueWords(userId: string): Promise<WordWithProgress[]> {
  // Fetch words where:
  // 1. User owns the list
  // 2. next_review_date <= today
  // 3. Not already reviewed today

  const dueWords = words.filter((w) => {
    const progress = w.word_progress?.[0]
    if (!progress) return true // New word
    return new Date(progress.next_review_date) <= today
  })

  return dueWords
}
```

#### Daily Puzzle Generation

The `get-todays-puzzles` Edge Function:

1. Fetches due words for user
2. Limits to 50 words (performance)
3. Checks puzzle cache (24-hour validity)
4. Generates puzzle(s) if not cached
5. Saves to cache
6. Returns puzzle(s) + metadata

---

## Authentication & Subscription Flow

### Authentication Flow

#### Signup Process

```
User fills signup form
        ↓
Submit to Supabase Auth.signUp()
        ↓
Email confirmation sent (if enabled)
        ↓
Account created in `users` table
        ↓
JWT token generated and stored
        ↓
post-login-hook Edge Function called
        ↓
User redirected to dashboard
```

#### Login Process

```
User submits email + password
        ↓
Supabase Auth.signInWithPassword()
        ↓
JWT token returned
        ↓
post-login-hook Edge Function called
        ↓
Subscription status added to JWT
        ↓
User logged in
```

#### Session Management

- **Storage**: JWT stored in browser's secure storage (Supabase handles)
- **Refresh**: Automatic token refresh before expiration
- **Real-time**: Supabase auth state listeners trigger React updates
- **Logout**: Clear token and redirect to login

### Subscription Flow

#### Trial Period

- **Duration**: 7 days from signup
- **Status in JWT**: `app_metadata.subscription_status = 'trial'`
- **Access**: Full app access during trial
- **Expiration**: Automatic after 7 days without payment

```sql
-- user.trial_end_date = signup_date + 7 days
```

#### Stripe Checkout

```
User clicks "Upgrade"
        ↓
Client calls Edge Function: create-checkout
        ↓
Function creates Stripe CheckoutSession
        ↓
Returns checkout URL
        ↓
User redirected to Stripe Checkout
        ↓
User completes payment
        ↓
Stripe webhook: checkout.session.completed
        ↓
stripe-webhook Edge Function processes
        ↓
Creates Stripe subscription
        ↓
Updates user.stripe_subscription_id
        ↓
Updates JWT with subscription status
        ↓
Stripe redirects to /subscription/success
```

#### Subscription States in JWT

```typescript
interface SubscriptionMetadata {
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due' | 'none'
  subscriptionId?: string
  customerId?: string
  trialEndDate?: string
  subscriptionEndDate?: string
}
```

#### Webhook Events

**Stripe webhooks** update subscription status:

| Event                           | Action                          |
| ------------------------------- | ------------------------------- |
| `checkout.session.completed`    | Create subscription, update JWT |
| `customer.subscription.updated` | Update subscription metadata    |
| `customer.subscription.deleted` | Cancel subscription, update JWT |
| `invoice.payment_succeeded`     | Mark payment successful         |
| `invoice.payment_failed`        | Notify user of payment failure  |

#### Security Measures

1. **Webhook Signature Verification**: All webhooks validated with Stripe secret
2. **Idempotency**: `stripe_webhook_events` table prevents duplicate processing
3. **Rate Limiting**: Webhook endpoint rate-limited to 50 requests/minute
4. **JWT Updates**: Subscription status in JWT → instant access without DB queries
5. **Circuit Breaker**: Failsafe if Stripe API is down

---

## Data Flows

### Daily Puzzle Generation Flow

```
User visits /app/todays-puzzles
        ↓
TodaysPuzzles component mounts
        ↓
useTodaysPuzzles() hook called
        ↓
React Query calls getTodaysPuzzles()
        ↓
Client sends GET to /functions/get-todays-puzzles
        ↓
Edge Function:
  1. Extract user from JWT
  2. Fetch due words from database
  3. Check puzzle_cache table
  4. If cached and valid (< 24h):
     - Return cached puzzle
  5. Else:
     - Call generatePuzzles() algorithm
     - Save to puzzle_cache
     - Return generated puzzle
        ↓
Puzzle displayed to user
        ↓
User solves puzzle, submits answers
        ↓
savePuzzleSession() called
        ↓
Saves to puzzle_sessions and word_reviews
        ↓
bulkUpdateProgress() called
        ↓
Updates word_progress for each word
        ↓
Streak maintained/updated
        ↓
Success notification shown
```

### Word Review and Progress Update Flow

```
User submits puzzle answer for a word
        ↓
Compare answer with word_reviews table data
        ↓
Determine review_type:
  - Correct + instant = 'perfect'
  - Correct + hints = 'half_known'
  - Partial reveal = 'conditional'
  - Incorrect = 'unknown'
  - >70% revealed = 'not_evaluated'
        ↓
Calculate SM-2 updates:
  - New ease_factor
  - New interval_days
  - New next_review_date
  - Increment total_reviews, correct/incorrect
        ↓
Update word_progress row
        ↓
Log review in word_reviews
        ↓
Update daily_completions for streak
        ↓
Cache invalidated for due words
        ↓
User sees updated progress
```

### List Sharing Flow (Static Copy)

```
Owner creates share link
        ↓
createShareLink() called
        ↓
Creates shared_lists entry:
  - share_mode = 'copy'
  - generate share_token
  - original_list_id = user's list
        ↓
Share link sent to recipient: /shared/TOKEN
        ↓
Recipient (anonymous or logged in) visits link
        ↓
accessSharedList(token) called
        ↓
Validates token and checks permissions
        ↓
If authenticated user:
  - Shows options to "View" or "Copy to My Lists"
        ↓
User clicks "Copy to My Lists"
        ↓
copySharedList(token) called
        ↓
Creates new word_lists entry for recipient
        ↓
Copies all words from original list
        ↓
Initializes separate word_progress for recipient
        ↓
Recipient now owns independent copy
        ↓
Can edit, add, delete words separately
```

### Collaborative List Flow (Real-time Sync)

```
Owner creates share link
        ↓
createShareLink() called
        ↓
Creates shared_lists entry:
  - share_mode = 'collaborative'
  - original_list_id = shared list
        ↓
Recipient visits /shared/TOKEN
        ↓
joinCollaborativeList(token) called
        ↓
Adds entry to list_collaborators table
        ↓
Recipient can now:
  - See all words in list
  - Add/edit/delete words
  - See other collaborators
  - View collaborative leaderboard
        ↓
All edits sync in real-time:
  - Supabase real-time subscription
  - All collaborators notified of changes
  - Optimistic updates on UI
        ↓
SRS progress tracked separately:
  - Each user has own word_progress rows
  - No shared learning state
  - Individual leaderboard scores
```

### Learning Buddy Invitation Flow

```
User creates buddy invite
        ↓
createBuddyInvite() called
        ↓
Generates crypto-secure invite_token
        ↓
Creates buddy_invites entry:
  - inviter_id = current user
  - expires_at = now + 30 days
        ↓
Share link sent to buddy: /buddy/accept/TOKEN
        ↓
Buddy visits link
        ↓
acceptBuddyInvite(token) called
        ↓
Validates token and checks expiration
        ↓
Creates buddies entry
        ↓
Marks buddy_invites as used
        ↓
Buddy relationship established
        ↓
Both users see:
  - Buddy widget on dashboard
  - Buddy's current streak
  - Buddy's daily completion status
  - Motivation message from buddy
```

---

## Edge Functions

Edge Functions are server-side TypeScript code that runs on Supabase infrastructure.

### Function Structure

```
supabase/functions/
├── function-name/
│   └── index.ts            # Main handler
├── _shared/                 # Shared utilities
│   ├── logger.ts
│   ├── security.ts
│   ├── validation.ts
│   ├── idempotency.ts
│   ├── retry.ts
│   └── circuitBreaker.ts
├── _middleware/
│   └── rateLimit.ts
├── get-todays-puzzles/      # Generate daily puzzles
├── stripe-webhook/          # Process Stripe events
├── create-checkout/         # Create Stripe checkout
├── create-portal-session/   # Customer portal
├── update-user-subscription/# Refresh subscription
├── check-subscription/      # Verify access
├── post-login-hook/         # Post-auth setup
├── daily-streak-maintenance/# Maintain streaks
└── monthly-streak-reset/    # Reset monthly data
```

### get-todays-puzzles

**Endpoint**: `POST /functions/v1/get-todays-puzzles`
**Auth**: Requires valid JWT
**Purpose**: Generate or fetch cached daily puzzles

**Request**:

```json
{
  "headers": {
    "Authorization": "Bearer <JWT_TOKEN>"
  }
}
```

**Response**:

```json
{
  "puzzles": [
    {
      "id": "puzzle-id",
      "grid": 16,
      "words": [...],
      "clues": { "across": [...], "down": [...] }
    }
  ],
  "totalWords": 45,
  "cached": false,
  "message": "Generated fresh puzzles"
}
```

**Implementation Details**:

- Fetches due words using `next_review_date <= today`
- Checks `puzzle_cache` for valid entries (< 24 hours)
- Calls `generatePuzzles()` algorithm if needed
- Saves to cache with 24-hour expiration
- Limits to 50 words per session (performance)

---

### stripe-webhook

**Endpoint**: `POST /functions/v1/stripe-webhook`
**Auth**: None (uses Stripe signature verification)
**Purpose**: Handle all Stripe subscription events (PUBLIC endpoint)

**Security Layers**:

1. **Signature Verification**: Validates webhook with `STRIPE_WEBHOOK_SECRET`
2. **Rate Limiting**: 50 requests/minute max
3. **Idempotency**: Checks `stripe_webhook_events` table
4. **Input Validation**: Validates Stripe event structure
5. **Circuit Breaker**: Failsafe if service is down

**Events Handled**:

| Event                           | Action                                   |
| ------------------------------- | ---------------------------------------- |
| `checkout.session.completed`    | Create subscription, update JWT metadata |
| `customer.subscription.updated` | Update subscription dates and status     |
| `customer.subscription.deleted` | Mark subscription cancelled              |
| `invoice.payment_succeeded`     | Log successful payment                   |
| `invoice.payment_failed`        | Notify user of payment failure           |

**Process**:

```
1. Extract Stripe signature
2. Reconstruct request body
3. Verify signature with cryptographic check
4. Parse event JSON
5. Check idempotency (prevent duplicate processing)
6. Validate event data structure
7. Route to appropriate handler
8. Update database
9. Update JWT metadata
10. Store in idempotency log
11. Return 200 OK
```

---

### create-checkout

**Endpoint**: `POST /functions/v1/create-checkout`
**Auth**: Requires valid JWT
**Purpose**: Create Stripe checkout session

**Request**:

```json
{
  "headers": { "Authorization": "Bearer <JWT_TOKEN>" }
}
```

**Response**:

```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

**Process**:

1. Extract user from JWT
2. Get or create Stripe customer
3. Create checkout session
4. Set success/cancel redirect URLs
5. Return checkout URL

---

### create-portal-session

**Endpoint**: `POST /functions/v1/create-portal-session`
**Auth**: Requires valid JWT
**Purpose**: Create customer portal session for subscription management

**Response**:

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**Features**:

- Update payment method
- View invoices
- Download receipts
- Cancel subscription

---

### update-user-subscription

**Endpoint**: `POST /functions/v1/update-user-subscription`
**Auth**: Requires valid JWT
**Purpose**: Manually refresh subscription status from Stripe

**Process**:

1. Extract user from JWT
2. Query Stripe for subscription details
3. Update database (`users` table)
4. Regenerate JWT with new subscription metadata
5. Return updated JWT

---

### check-subscription

**Endpoint**: `POST /functions/v1/check-subscription`
**Auth**: Requires valid JWT
**Purpose**: Verify user has access (trial or paid)

**Response**:

```json
{
  "hasAccess": true,
  "status": "active",
  "expiresAt": "2025-12-31"
}
```

---

### post-login-hook

**Trigger**: After user logs in
**Purpose**: Setup tasks after authentication

**Tasks**:

1. Check if user exists in `users` table
2. If new user:
   - Create `user_streaks` entry
   - Create `daily_completions` entry
   - Set trial period
3. Refresh subscription metadata in JWT

---

### daily-streak-maintenance

**Trigger**: Scheduled nightly (maintenance window)
**Purpose**: Reset streaks for users who missed a day

**Logic**:

```
FOR each user:
  IF last_streak_update < yesterday:
    IF streak_freezes_available > 0:
      Use freeze, don't reset streak
    ELSE:
      Reset current_streak to 0
```

---

### monthly-streak-reset

**Trigger**: First day of month
**Purpose**: Reset longest streak tracking for new month

---

## Error Handling & Security

### Error Handling Strategy

#### Frontend Error Boundaries

```typescript
// src/components/common/ErrorBoundary.tsx
// Catches component render errors
// Shows fallback UI
// Logs to Sentry
// Prevents full app crash
```

#### API Error Handling

```typescript
// Standardized error handling in all API calls
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data
} catch (error) {
  logger.error('Operation failed', { error, context })
  throw new APIError('User-friendly message', error.code, error)
}
```

#### React Query Error Handling

```typescript
// Automatic retry logic
// Exponential backoff
// User notifications on critical failures
// Cache fallback for offline usage
```

### Security Measures

#### Authentication & Authorization

1. **JWT-Based Auth**: All requests require valid JWT
2. **Row Level Security**: Database enforces access control
3. **Protected Routes**: Frontend route guards prevent unauthorized access
4. **Auth Guards**: `useAuthGuard()` validates session before operations

#### API Security

1. **Input Validation**: All user inputs validated before processing
2. **Rate Limiting**: Webhook endpoints rate-limited (50 req/min)
3. **CORS**: Strict CORS headers on Edge Functions
4. **HTTPS Only**: All connections encrypted

#### Database Security

1. **RLS Policies**: Users can only access own data
2. **SQL Injection Prevention**: Supabase prepared statements
3. **Secrets Management**: Environment variables for sensitive data
4. **Audit Logging**: Stripe events logged for compliance

#### Webhook Security

1. **Signature Verification**: Stripe webhooks verified with secret
2. **Idempotency**: Duplicate webhooks detected and ignored
3. **Suspicious Pattern Detection**: Rate limits and unusual patterns logged
4. **Circuit Breaker**: Service protection against cascading failures

#### Data Privacy

1. **SRS Progress Private**: Each user's learning progress isolated
2. **No Unnecessary Sharing**: Only shared when explicitly opted in
3. **Leaderboard Opt-in**: Users choose to appear on leaderboards
4. **GDPR Compliance**: User data deletion and export support

---

## Key Hooks

### useAuth() `src/hooks/useAuth.ts`

Manages authentication state and session.

```typescript
const {
  user, // Current user object
  loading, // Auth state loading
  hasAccess, // Subscription access
  subscription: {
    status, // 'trial', 'active', 'cancelled', 'expired'
    trialEndDate,
    subscriptionEndDate,
  },
  logout,
} = useAuth()
```

### useAuthGuard() `src/hooks/useAuthGuard.ts`

Validates session before operations.

```typescript
const { validateSession, clearSession } = useAuthGuard()
// Use before sensitive operations
await validateSession()
```

### useWordLists() `src/hooks/useWords.ts`

Manage word lists with React Query.

```typescript
const {
  data: wordLists,
  isLoading,
  error,
  createMutation,
  updateMutation,
  deleteMutation,
} = useWordLists()

// Usage
await createMutation.mutateAsync({ name, source_language, target_language })
```

### useTodaysPuzzles() `src/hooks/useTodaysPuzzles.ts`

Fetch and manage daily puzzles.

```typescript
const {
  data: { puzzles, totalWords },
  isLoading,
  error,
  refetch,
} = useTodaysPuzzles()
```

### usePuzzleSolver() `src/hooks/usePuzzleSolver.ts`

Track puzzle solving state and submissions.

```typescript
const { grid, clues, userAnswers, setUserAnswer, submitPuzzle, hint, isSubmitting } =
  usePuzzleSolver(puzzle)
```

### useSubscription() `src/hooks/useSubscription.ts`

Check subscription status (note: prefer JWT).

```typescript
const { status, isLoading, refresh } = useSubscription()
```

### useBuddy() `src/hooks/useBuddy.ts`

Manage learning buddy relationship.

```typescript
const { buddy, isLoading, createInvite, acceptInvite, removeBuddy } = useBuddy()
```

### useCollaborativeLists() `src/hooks/useCollaborativeLists.ts`

Real-time collaborative list management.

```typescript
const { lists, leaderboard, addWord, deleteWord, updateWord } = useCollaborativeLists(listId)

// Real-time updates via Supabase subscriptions
```

### useStreak() `src/hooks/useStreak.ts`

Track user's daily streak.

```typescript
const { currentStreak, longestStreak, freezesAvailable, useFreeze, recordCompletion } = useStreak()
```

### usePerformanceInsights() `src/hooks/usePerformanceInsights.ts`

Analytics and learning metrics.

```typescript
const { stageDistribution, weakestWords, bestLearningTime, weeklyActivity } =
  usePerformanceInsights()
```

### usePuzzleGeneratorWorker() `src/hooks/usePuzzleGeneratorWorker.ts`

Web Worker for non-blocking puzzle generation.

```typescript
const { puzzle, isGenerating, error, generate } = usePuzzleGeneratorWorker(words)

// Puzzle generation runs in background thread
```

---

## File Structure

### Complete Project Organization

```
EduPuzzle/
├── src/
│   ├── components/              # React components
│   │   ├── auth/
│   │   │   ├── AuthForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── SubscriptionGate.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── common/
│   │   │   └── ErrorBoundary.tsx
│   │   ├── dashboard/
│   │   │   ├── BuddyWidget.tsx
│   │   │   ├── StreakDisplay.tsx
│   │   │   ├── StreakProgress.tsx
│   │   │   └── PerformanceInsights.tsx
│   │   ├── landing/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   └── Footer.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   └── ProfileMenu.tsx
│   │   ├── performance/
│   │   │   ├── BestLearningTime.tsx
│   │   │   ├── StageDistributionChart.tsx
│   │   │   ├── WeakestWords.tsx
│   │   │   └── WeeklyActivityChart.tsx
│   │   ├── puzzle/
│   │   │   ├── PuzzleGrid.tsx
│   │   │   ├── PuzzleClues.tsx
│   │   │   ├── PuzzleCompletionCard.tsx
│   │   │   ├── PuzzleHelpDialog.tsx
│   │   │   └── PuzzlePageStates.tsx
│   │   ├── settings/
│   │   │   └── BuddySettings.tsx
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (20+ more)
│   │   ├── words/
│   │   │   ├── WordListDetail.tsx
│   │   │   ├── CollaborativeWordList.tsx
│   │   │   ├── CreateWordDialog.tsx
│   │   │   ├── CreateWordListDialog.tsx
│   │   │   ├── CollaborativeLeaderboard.tsx
│   │   │   ├── CollaboratorPresence.tsx
│   │   │   ├── SharedListActions.tsx
│   │   │   └── WordTable.tsx
│   │   └── subscription/
│   │       ├── SubscriptionForm.tsx
│   │       └── SubscriptionStatus.tsx
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAuthGuard.ts
│   │   ├── useBuddy.ts
│   │   ├── useCheckout.ts
│   │   ├── useCollaborativeLists.ts
│   │   ├── useConflictResolution.ts
│   │   ├── useCustomerPortal.ts
│   │   ├── useDebounce.ts
│   │   ├── useErrorBoundary.ts
│   │   ├── useIntersectionObserver.ts
│   │   ├── useLeaderboard.ts
│   │   ├── useMonitoring.ts
│   │   ├── usePerformanceInsights.ts
│   │   ├── usePostPayment.ts
│   │   ├── usePuzzleGeneration.ts
│   │   ├── usePuzzleGeneratorWorker.ts
│   │   ├── usePuzzleSolver.ts
│   │   ├── useScrollSpy.ts
│   │   ├── useSequentialOperations.ts
│   │   ├── useSharedLists.ts
│   │   ├── useShareLink.ts
│   │   ├── useStreak.ts
│   │   ├── useSubscription.ts
│   │   ├── useSubscriptions.ts
│   │   ├── useTimer.ts
│   │   ├── useTodaysPuzzles.ts
│   │   ├── useWordLists.ts
│   │   ├── useWords.ts
│   │   └── __tests__/           # Hook unit tests
│   │
│   ├── lib/
│   │   ├── algorithms/          # Puzzle generation algorithms
│   │   │   ├── clustering.ts    # Group words by letter overlap
│   │   │   ├── connectivity.ts  # Validate grid connectivity
│   │   │   ├── generator.ts     # Main orchestrator
│   │   │   ├── grid.ts          # Grid data structure
│   │   │   ├── placement.ts     # Find word placement positions
│   │   │   └── scoring.ts       # Score placements
│   │   │
│   │   ├── api/                 # Supabase API layer
│   │   │   ├── buddy.ts
│   │   │   ├── leaderboard.ts
│   │   │   ├── performance.ts
│   │   │   ├── puzzles.ts
│   │   │   ├── sharedLists.ts
│   │   │   ├── srs.ts           # Spaced repetition system
│   │   │   ├── streak.ts
│   │   │   ├── stripe.ts
│   │   │   ├── supabaseClient.ts
│   │   │   ├── wordLists.ts
│   │   │   ├── words.ts
│   │   │   └── buddy.test.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.ts       # Utility functions
│   │   │   └── puzzleProgress.ts
│   │   │
│   │   ├── auth.ts              # Supabase auth setup
│   │   ├── logger.ts            # Logging utility
│   │   ├── puzzleGenerator.ts   # Wrapper for puzzle generation
│   │   ├── sentry.ts            # Sentry error tracking
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts             # General utilities
│   │
│   ├── pages/                   # Page/route components
│   │   ├── Settings/
│   │   │   ├── AccountSettings.tsx
│   │   │   ├── Buddy.tsx
│   │   │   ├── PerformanceStats.tsx
│   │   │   ├── SettingsLayout.tsx
│   │   │   └── SubscriptionSettings.tsx
│   │   ├── BuddyAccept.tsx
│   │   ├── Dashboard.tsx
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── PuzzleSolver.tsx
│   │   ├── SharedList.tsx
│   │   ├── SignupPage.tsx
│   │   ├── SubscriptionCancel.tsx
│   │   ├── SubscriptionSuccess.tsx
│   │   ├── TodaysPuzzles.tsx
│   │   └── WordListDetail.tsx
│   │
│   ├── stores/                  # Zustand stores (minimal use)
│   │   ├── uiStore.ts
│   │   └── ...
│   │
│   ├── test/
│   │   ├── setup.ts             # Vitest configuration
│   │   └── sharing.test.ts      # Sharing feature tests
│   │
│   ├── types/
│   │   ├── database.types.ts    # Generated from Supabase schema
│   │   ├── index.ts             # Main type exports
│   │   ├── leaderboard.types.ts
│   │   └── performance.types.ts
│   │
│   ├── workers/
│   │   └── puzzleGenerator.worker.ts  # Web Worker for puzzle generation
│   │
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global styles
│   └── vite-env.d.ts           # Vite types
│
├── supabase/
│   ├── functions/              # Edge Functions (Deno/TypeScript)
│   │   ├── get-todays-puzzles/
│   │   │   ├── index.ts        # Main handler
│   │   │   ├── generator.ts    # Puzzle generation (Deno version)
│   │   │   ├── types.ts        # Type definitions
│   │   │   └── placement.ts    # Placement algorithm
│   │   │
│   │   ├── stripe-webhook/
│   │   │   └── index.ts        # Webhook handler
│   │   │
│   │   ├── create-checkout/
│   │   │   └── index.ts
│   │   │
│   │   ├── create-portal-session/
│   │   │   └── index.ts
│   │   │
│   │   ├── update-user-subscription/
│   │   │   └── index.ts
│   │   │
│   │   ├── check-subscription/
│   │   │   └── index.ts
│   │   │
│   │   ├── post-login-hook/
│   │   │   └── index.ts
│   │   │
│   │   ├── daily-streak-maintenance/
│   │   │   └── index.ts
│   │   │
│   │   ├── monthly-streak-reset/
│   │   │   └── index.ts
│   │   │
│   │   ├── _shared/            # Shared utilities
│   │   │   ├── circuitBreaker.ts
│   │   │   ├── idempotency.ts
│   │   │   ├── logger.ts
│   │   │   ├── retry.ts
│   │   │   ├── security.ts
│   │   │   └── validation.ts
│   │   │
│   │   └── _middleware/
│   │       └── rateLimit.ts
│   │
│   ├── migrations/              # Database migrations
│   │   └── *.sql
│   │
│   └── config.toml             # Supabase local config
│
├── scripts/
│   ├── backfill-subscription-metadata.ts
│   ├── refresh-user-subscription.ts
│   └── set-user-trial.sql
│
├── .claude                      # Claude configuration
├── .env.example                 # Example environment variables
├── .eslintrc.cjs               # ESLint config
├── .gitignore
├── .prettierrc                  # Prettier config
├── components.json              # shadcn/ui config
├── index.html
├── netlify.toml                 # Netlify deployment config
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── README.md
├── EduPuzzle.md                 # THIS FILE
└── LICENSE
```

---

## Development Workflow

### Starting Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start development server
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Building for Production

```bash
# Build optimized bundle
pnpm build

# Preview production build locally
pnpm preview

# Deploy (via Netlify)
# Automatically triggered on push to main
```

### Database Migrations

```bash
# List migrations
supabase migration list

# Create new migration
supabase migration new <migration_name>

# Apply migrations
supabase db push

# Reset local database
supabase db reset
```

### Type Generation

```bash
# Regenerate TypeScript types from database schema
supabase gen types typescript --local > src/types/database.types.ts
```

---

## Common Development Tasks

### Adding a New Word List Feature

1. Update database schema (if needed)
2. Create API functions in `src/lib/api/wordLists.ts`
3. Create hook in `src/hooks/useWordLists.ts`
4. Create component in `src/components/words/`
5. Add route in `src/pages/` or `App.tsx`
6. Test and deploy

### Modifying SRS Algorithm

1. Update SM-2 calculations in `src/lib/api/srs.ts`
2. Update `word_progress` update logic
3. Verify stage progression and intervals
4. Test with real puzzle sessions
5. Deploy and monitor

### Adding a New Stripe Event

1. Add event handler in `supabase/functions/stripe-webhook/index.ts`
2. Add validation logic to `supabase/functions/_shared/validation.ts`
3. Update database schema (if needed)
4. Test with Stripe webhook simulator
5. Deploy and verify with test events

### Debugging Puzzle Generation

1. Check `puzzle_cache` table for cached puzzles
2. Review logs in `supabase/functions/get-todays-puzzles/`
3. Test algorithm locally with `usePuzzleGeneratorWorker()`
4. Verify word clustering and placement
5. Check connectivity validation

---

## Key Insights for Developers

1. **JWT-First Design**: Subscription status is in JWT, not database - speeds up access control
2. **Server-Side Puzzles**: Puzzle generation on Edge Functions prevents client overhead
3. **React Query Everywhere**: All server state managed through React Query for consistency
4. **RLS Everything**: Database enforces access control, not just frontend
5. **Optimistic Updates**: UI updates immediately, rolls back on error for smooth UX
6. **Real-time Collaboration**: Supabase subscriptions enable live list editing
7. **SM-2 Customization**: Algorithm adapted for vocabulary with adaptive intervals
8. **Caching Strategy**: 24-hour puzzle cache prevents regeneration, ensures consistency
9. **Error Boundaries**: Components isolated from crashes, better resilience
10. **Web Workers**: Puzzle generation non-blocking for responsive UI

---

## Troubleshooting Guide

### User Can't Access App After Trial Ends

**Problem**: Trial expired but subscription not set
**Solution**:

- Check `users.trial_end_date`
- Verify Stripe webhook processed `checkout.session.completed`
- Check `stripe_webhook_events` for events
- Manually run `update-user-subscription` Edge Function

### Puzzles Not Generating

**Problem**: `get-todays-puzzles` fails
**Solution**:

- Check due words: `SELECT * FROM word_progress WHERE next_review_date <= today`
- Verify puzzle cache hasn't hit limit
- Check Edge Function logs in Supabase
- Verify algorithm doesn't hit 5-second timeout with large word sets

### Real-time Collaboration Not Syncing

**Problem**: Collaborative list changes not appearing for others
**Solution**:

- Check Supabase real-time subscription is active
- Verify list has `is_collaborative = true`
- Check network connectivity
- Restart browser tab

### SRS Progress Not Updating

**Problem**: Word stage not advancing after review
**Solution**:

- Check `word_reviews` for entry
- Verify `bulkUpdateProgress()` was called
- Check SM-2 calculation logic
- Verify `word_progress` row was updated

---

## Conclusion

EduPuzzle is a comprehensive, well-architected vocabulary learning application that combines modern web technologies with sophisticated algorithms for optimal learning outcomes. The codebase is organized for maintainability, with clear separation of concerns between frontend, Edge Functions, and database logic.

By understanding the architecture, data flows, and key algorithms documented here, developers can confidently work with the codebase, add features, and maintain the system's reliability and performance.

For detailed implementation questions, refer to specific files documented in the [File Structure](#file-structure) section, or consult the README.md for specific setup instructions.

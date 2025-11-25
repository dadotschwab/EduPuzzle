# EduPuzzle - Application Documentation

## Part 1: What is EduPuzzle?

### Overview

EduPuzzle is a desktop-first web application that gamifies vocabulary learning by combining **Spaced Repetition Learning (SRS)** with **crossword puzzle generation**. The app intelligently generates crossword puzzles from users' vocabulary lists and tracks their learning progress using scientifically-backed spaced repetition algorithms.

### Key Features

#### 1. **Intelligent Crossword Generation**

- Automatically generates fully-connected crossword puzzles with no isolated clusters
- Creates puzzles from user-selected vocabulary words
- Ensures 100% word coverage (all due words included in each puzzle)
- Generates puzzles in under 5 seconds using an "Incremental Best-Fit" algorithm
- Handles varying word list sizes by splitting into multiple puzzles when needed

#### 2. **Vocabulary Management**

- Create custom word lists with definitions, hints, and example usage
- Organize words by language and difficulty
- Import words from templates or create lists from scratch
- Edit and delete word lists
- Track total words and learning progress per list

#### 3. **Spaced Repetition System (SRS)**

- Scientifically-backed learning intervals: 1, 3, 7, 14, 30, 90, and 180 days
- Six proficiency levels (0-6) that determine when words are next reviewed
- Five review types: Perfect, Half Known, Conditional, Unknown, and Not Evaluated
- Automatic interval adjustment based on user performance
- Progress tracking with statistics per word and per list

#### 4. **Word List Sharing**

- **Static Copy Sharing**: Recipients get independent copies; changes don't affect the original
- **Collaborative Sharing**: Multiple users can edit the same list in real-time
- Secure, cryptographically-signed share tokens
- Support for both authenticated and anonymous users (for copy sharing)
- Individual SRS progress tracking even in collaborative lists

#### 5. **Subscription Model**

- 7-day free trial with full feature access
- €6.99/month subscription after trial expires
- Stripe integration for secure payments
- Customer portal for managing subscriptions and billing
- Cancellation support with pro-rata refunds

#### 6. **Progress Tracking & Analytics**

- Daily puzzle statistics
- Word-level learning history
- SRS interval visualization
- Estimated time to mastery calculations
- Leaderboard support (infrastructure in place)

### Tech Stack

#### Frontend

- **React 18**: Component-based UI framework
- **TypeScript 5**: Type-safe JavaScript
- **Vite 5**: Fast build tool and dev server
- **TailwindCSS 3.x**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible React components
- **React Query**: Server state management with caching
- **Zustand**: Lightweight client state management
- **Web Workers**: Non-blocking puzzle generation

#### Backend & Database

- **Supabase**: PostgreSQL database with built-in features
  - Row Level Security (RLS) for fine-grained access control
  - Real-time subscriptions for collaborative features
  - Edge Functions for serverless APIs
  - Authentication with email/password and OAuth support
- **PostgreSQL**: Relational database with advanced features
  - Jsonb columns for flexible data storage
  - Full-text search capabilities
  - Triggers for automated workflows

#### Payments & Billing

- **Stripe**: Payment processing and subscription management
- **Webhook handlers**: For payment events and subscription lifecycle

#### Deployment

- **Netlify**: Frontend hosting with automatic deployments
- **Supabase Cloud**: Backend hosting and database
- **Deno/Edge Functions**: Serverless functions for APIs

---

## Part 2: How EduPuzzle Works

### System Architecture

EduPuzzle follows a three-tier architecture:

```
┌─────────────────────────────────┐
│   Frontend (React/TypeScript)   │
│  - Components, Hooks, State     │
└────────────────┬────────────────┘
                 │ API Calls & Real-time Subscriptions
                 ▼
┌─────────────────────────────────┐
│   Backend (Supabase/Edge Fn)    │
│  - Authentication, RLS, APIs    │
└────────────────┬────────────────┘
                 │ SQL Queries
                 ▼
┌─────────────────────────────────┐
│  Database (PostgreSQL)          │
│  - Users, Words, Progress, etc. │
└─────────────────────────────────┘
```

### Core Data Flow

#### 1. **User Authentication Flow**

```
User enters credentials
    ↓
LoginForm component validates input
    ↓
Supabase Auth API authenticates
    ↓
JWT token stored in local storage
    ↓
ProtectedRoute checks authentication
    ↓
Dashboard accessible only to authenticated users
```

**Key Functions:**

- `useAuth()` hook (src/hooks/useAuth.ts): Manages auth state and user sessions
- `ProtectedRoute` component: Guards routes from unauthenticated access
- `supabase.auth.signIn()`: Handles login via Supabase Auth

#### 2. **Puzzle Generation Flow**

```
User opens "Today's Puzzles" page
    ↓
useTodaysPuzzles() hook fetches due words from SRS system
    ↓
Words sent to Web Worker (puzzleGenerator.worker.ts)
    ↓
Web Worker runs puzzle generation algorithm:
  1. Analyze word compatibility (shared letters)
  2. Sort words by length (longest first)
  3. Place words on grid using incremental best-fit
  4. Validate grid connectivity (no islands)
  5. Split into multiple puzzles if needed
    ↓
Generated puzzles returned to main thread
    ↓
PuzzleGrid component displays interactive puzzle
    ↓
User fills in answers and submits
    ↓
Answers validated and SRS progress updated
```

**Key Functions:**

- `useTodaysPuzzles()` hook (src/hooks/useTodaysPuzzles.ts): Fetches due words
- `puzzleGenerator.worker.ts`: Main puzzle generation algorithm
- `generator.ts`: Incremental Best-Fit placement algorithm
- `connectivity.ts`: Grid validation and connectivity checking
- `PuzzleGrid` component: Interactive puzzle UI

#### 3. **Spaced Repetition System (SRS) Flow**

```
User completes a puzzle and reviews words
    ↓
Determines review type:
  - Perfect: Correct immediately (advance level)
  - Half Known: Correct with hints (advance level)
  - Conditional: 30-70% revealed (same level)
  - Unknown: Incorrect (reset to level 0)
  - Not Evaluated: >70% revealed (no change)
    ↓
Updates word_progress table with new level and next_review_date
    ↓
SRS interval applied based on proficiency level:
  Level 0→1: 1 day    Level 3→4: 14 days
  Level 1→2: 3 days   Level 4→5: 30 days
  Level 2→3: 7 days   Level 5→6: 90→180 days
    ↓
word_reviews table records individual review session
    ↓
Dashboard shows updated progress and statistics
```

**Key Functions:**

- `usePuzzleSolver()` hook: Processes puzzle answers and determines review type
- `word_progress` table: Tracks SRS level and next review date
- `word_reviews` table: Historical record of all reviews
- SRS calculation functions in backend (check-subscription edge function)

#### 4. **Word List Sharing Flow (Collaborative)**

```
User A clicks "Share List" on their word list
    ↓
User selects "Collaborative" sharing mode
    ↓
Backend generates cryptographic share token
    ↓
Share token stored in shared_lists table
    ↓
Link with token sent to User B
    ↓
User B visits shared link
    ↓
Backend validates token and creates list_collaborators entry
    ↓
User B's word list references shared_lists entry
    ↓
Both users see real-time updates via Supabase subscriptions
    ↓
Individual SRS progress tracked separately per user
    ↓
Changes synced across all collaborators in real-time
```

**Key Functions:**

- `useSharedLists()` hook: Handles share token generation and validation
- `useCollaborativeLists()` hook: Real-time synchronization with Supabase subscriptions
- `shared_lists` table: Metadata about shared lists
- `list_collaborators` table: Track who has access to collaborative lists
- `CollaborativeWordList` component: UI for collaborative editing

#### 5. **Subscription & Payment Flow**

```
User completes free trial (7 days)
    ↓
Subscription Gate component shows payment prompt
    ↓
User clicks "Subscribe"
    ↓
Redirected to Stripe Checkout (create-checkout edge function)
    ↓
Checkout session created for €6.99/month
    ↓
User completes payment
    ↓
Stripe webhook sent to stripe-webhook edge function
    ↓
Webhook validates and processes payment event
    ↓
User subscription status updated in users table
    ↓
User redirected to SubscriptionSuccess page
    ↓
Dashboard and puzzles now fully accessible
```

**Key Functions:**

- `useCheckout()` hook: Initiates checkout session
- `useSubscription()` hook: Checks subscription status
- `create-checkout` edge function: Creates Stripe checkout session
- `stripe-webhook` edge function: Processes webhook events
- `SubscriptionGate` component: Paywall for non-subscribers

### Key Components & Their Responsibilities

#### Frontend Components

| Component               | Purpose                        | Key Props/State             |
| ----------------------- | ------------------------------ | --------------------------- |
| `LoginForm`             | Email/password authentication  | email, password, loading    |
| `ProtectedRoute`        | Route guard for auth pages     | children                    |
| `Dashboard`             | Main app hub, shows word lists | lists[], stats              |
| `PuzzleSolver`          | Interactive puzzle interface   | puzzleId, words[], grid[][] |
| `PuzzleGrid`            | Crossword grid renderer        | answers{}, onAnswer()       |
| `WordListDetail`        | View/edit word list            | listId, words[]             |
| `CollaborativeWordList` | Real-time shared list editor   | listId, collaborators[]     |
| `SubscriptionGate`      | Paywall component              | children, isSubscribed      |
| `Settings`              | User preferences & billing     | subscription, billing       |

#### Custom Hooks

| Hook                        | Purpose                         | Returns                                         |
| --------------------------- | ------------------------------- | ----------------------------------------------- |
| `useAuth()`                 | Auth state management           | user, session, signUp(), signIn(), signOut()    |
| `useTodaysPuzzles()`        | Fetch due words and puzzles     | puzzles[], loading, error                       |
| `usePuzzleSolver()`         | Process puzzle answers          | submitAnswer(), reviewType, grade               |
| `useWordLists()`            | CRUD operations on lists        | lists[], createList(), deleteList()             |
| `useCollaborativeLists()`   | Real-time sync for shared lists | words[], updateWord(), onRemoteChange()         |
| `useSubscription()`         | Subscription status             | isSubscribed, trialEndsAt, cancelSubscription() |
| `useCheckout()`             | Stripe checkout initiation      | startCheckout(), sessionUrl                     |
| `useSequentialOperations()` | Prevent race conditions         | enqueue(), processing                           |

#### Backend Edge Functions

| Function                | Purpose                                     | Trigger             |
| ----------------------- | ------------------------------------------- | ------------------- |
| `check-subscription`    | Verify subscription status, fetch due words | GET request         |
| `create-checkout`       | Create Stripe checkout session              | POST request        |
| `create-portal-session` | Create Stripe customer portal               | POST request        |
| `get-todays-puzzles`    | Generate puzzles for due words              | GET request         |
| `stripe-webhook`        | Process Stripe payment events               | Webhook from Stripe |

### Database Schema Overview

#### Core Tables

```sql
-- Users and authentication
users (id, email, subscription_status, trial_ends_at, stripe_customer_id)

-- Vocabulary management
word_lists (id, user_id, name, language, description, created_at)
words (id, list_id, word, definition, hint, example, language)

-- SRS tracking
word_progress (id, user_id, word_id, level, next_review_date, last_reviewed_at)
word_reviews (id, user_id, word_id, review_type, timestamp)

-- Sharing and collaboration
shared_lists (id, original_list_id, share_token, is_collaborative, created_by)
list_collaborators (id, shared_list_id, user_id, joined_at)

-- Puzzle sessions
puzzle_sessions (id, user_id, words[], grid[][], completed_at)

-- Webhook deduplication
webhook_events (id, stripe_event_id, timestamp)
```

#### Row Level Security (RLS)

All tables have RLS policies enforcing:

- Users can only see their own data
- Shared list collaborators can access list contents
- Service role functions can bypass RLS for business logic

---

## Part 3: User Stories

### Story 1: New User Learning Journey

**Actor**: Sarah, a Spanish learner

**Scenario**:

1. Sarah visits EduPuzzle and sees the landing page with features and pricing
2. She signs up for a free account to test the app
3. She creates a word list "Spanish Verbs" and adds 15 Spanish verbs with definitions and hints
4. The next day, Sarah opens her Dashboard and sees "Today's Puzzles"
5. The app has automatically selected 10 due verbs from her list
6. A crossword puzzle is generated with all 10 verbs connected
7. Sarah solves the puzzle by filling in the answers
8. For each word, she indicates: correct, correct with hints, or incorrect
9. The SRS system automatically schedules review times based on her performance
10. Words she got wrong are scheduled for 1 day later; correct ones for 3 days later
11. Sarah continues solving puzzles daily for 7 days (free trial)
12. On day 8, she's asked to subscribe (€6.99/month)
13. She completes payment via Stripe and continues learning

**Data Flow**:

```
Sign Up → Create List → Add Words → Generate Puzzle → Solve Puzzle
→ SRS Update → Review Schedule → Payment → Continued Learning
```

---

### Story 2: Collaborative Learning Group

**Actor**: Teacher Tom shares vocabulary with students

**Scenario**:

1. Tom creates a word list "French Exam Vocabulary" with 50 words
2. He clicks "Share List" and selects "Collaborative Mode"
3. EduPuzzle generates a secure share link with a cryptographic token
4. Tom shares the link with his 20 students via email
5. Student Alice clicks the link and is prompted to create an account
6. Alice creates her account and joins the collaborative list
7. She sees all 50 French words and starts solving puzzles
8. Her SRS progress is tracked independently from other students
9. Tom adds 5 new words to the list
10. All students instantly see the new words (via Supabase real-time subscriptions)
11. Alice's SRS progress remains unaffected; the new words appear in future puzzles
12. Alice adds her own annotations and notes to words
13. Tom removes a duplicate word entry
14. Alice's view updates in real-time without refreshing

**Data Flow**:

```
Create List → Share (Collaborative) → Generate Token → Students Join
→ Real-time Sync → Independent SRS Progress → Tom Edits → Alice Sees Changes Instantly
```

---

### Story 3: Gamified Learning with Progress Tracking

**Actor**: Marcus, a competitive learner

**Scenario**:

1. Marcus has been using EduPuzzle for 2 months with 3 word lists
2. He opens his Dashboard and sees aggregate statistics:
   - 245 words total across all lists
   - 89 words at mastery level (level 6)
   - 45 words scheduled for today
3. He sees "Today's Puzzles" showing 4 puzzles (45 words split across multiple grids)
4. Each puzzle is fully connected with no isolated word clusters
5. Marcus solves all 4 puzzles in 45 minutes
6. His performance is analyzed:
   - 38 words marked "Perfect" → advance to next SRS level
   - 5 words marked "Half Known" → advance to next SRS level
   - 2 words marked "Unknown" → reset to level 0, scheduled for tomorrow
7. Dashboard updates showing his new progress
8. He sees estimated time to mastery for remaining words
9. Marcus invites a friend to share one of his word lists
10. His friend gets a copy and starts their independent SRS journey
11. Marcus's progress is unaffected by his friend's learning

**Data Flow**:

```
Dashboard Stats → Fetch Due Words → Generate Puzzles → Solve Puzzles
→ Grade Answers → Update SRS Levels → Share List → Friend's Independent Progress
```

---

### Story 4: Payment & Subscription Management

**Actor**: Jennifer, evaluating the app

**Scenario**:

1. Jennifer signs up and explores the app (free trial)
2. After 5 days of use, she's satisfied and wants to continue
3. She navigates to Settings and sees "Subscription" tab
4. It shows: Trial expires in 2 days, then €6.99/month
5. She clicks "Subscribe Now"
6. She's redirected to a Stripe Checkout page
7. She enters her card details (never shared with EduPuzzle servers)
8. Stripe charges €6.99
9. Webhook is sent to EduPuzzle's stripe-webhook function
10. Her subscription status is updated to "active" in the database
11. She's redirected to SubscriptionSuccess page
12. All features remain unlocked indefinitely
13. Later, she decides to cancel in Settings → Manage Subscription
14. She's taken to Stripe Customer Portal
15. She confirms cancellation and receives a confirmation email
16. After current billing period, her access reverts to free tier

**Data Flow**:

```
Free Trial → Trial Ending Notification → Payment → Webhook Processing
→ Subscription Activated → Access Granted → Cancel → Subscription Deactivated
```

---

## Key Algorithms & Technical Deep Dives

### Crossword Generation Algorithm (Incremental Best-Fit)

**Objective**: Create fully-connected crossword puzzles with no isolated clusters in <5 seconds

**Steps**:

1. **Analysis Phase**: Calculate compatibility matrix (shared letters between words)
2. **Sorting Phase**: Sort words by length (longest first) for better placement
3. **Placement Phase**:
   - Place longest word in center of grid
   - For each remaining word, find best crossing point
   - Insert word into grid
   - Validate connectivity after each insertion
4. **Validation Phase**: Ensure all words form single connected component
5. **Split Phase**: If puzzle exceeds size limits, split into multiple puzzles

**Time Complexity**: O(n² × m) where n = word count, m = average word length
**Space Complexity**: O(w × h) where w, h = grid dimensions

### Spaced Repetition Algorithm

**Based on Ebbinghaus Forgetting Curve** with customizations:

```
Performance → Review Type → Level Change → Next Review Interval

Perfect (correct immediately)
  └→ Advance level by 1
  └→ Next review: SRS interval for new level

Half Known (correct with hints)
  └→ Advance level by 1
  └→ Next review: SRS interval for new level

Conditional (30-70% revealed)
  └→ Stay at current level
  └→ Next review: Same SRS interval

Unknown (incorrect)
  └→ Reset to level 0
  └→ Next review: 1 day

Not Evaluated (>70% revealed)
  └→ No change
  └→ Next review: Next day
```

**Intervals**:

- Level 0: 1 day
- Level 1: 3 days
- Level 2: 7 days
- Level 3: 14 days
- Level 4: 30 days
- Level 5: 90 days
- Level 6: 180 days

---

## Security & Performance Considerations

### Security

- **Row Level Security (RLS)**: Every table has policies ensuring users can only access their own data
- **Token-Based Sharing**: Share links use 256-bit cryptographic tokens
- **Rate Limiting**: Webhook endpoints limited to 50 requests/minute
- **Input Validation**: All API inputs validated before processing
- **Circuit Breakers**: Automatic service protection against cascading failures
- **Idempotency**: Duplicate webhook events prevented via event deduplication

### Performance

- **Web Workers**: Puzzle generation offloaded from main thread (non-blocking)
- **React Memoization**: Components optimized to prevent unnecessary re-renders
- **Debounced Inputs**: API calls debounced during collaborative editing
- **Database Indexing**: SRS queries optimized with proper indexes
- **Caching**: React Query caches puzzle and word list data

---

## Deployment Architecture

```
GitHub Repository
    ↓
Netlify (Frontend Hosting)
    ├─ Automatic builds on push
    ├─ React/TypeScript built with Vite
    └─ Deployed at edupuzzle.com

Supabase Cloud (Backend)
    ├─ PostgreSQL Database
    ├─ Edge Functions (Deno runtime)
    ├─ Real-time Subscriptions
    └─ Authentication & RLS

Stripe (Payment Processing)
    ├─ Checkout Sessions
    ├─ Webhooks → Supabase
    └─ Customer Portal
```

---

## Conclusion

EduPuzzle combines sophisticated algorithms (crossword generation, spaced repetition) with modern web technologies (React, Supabase, Stripe) to create an engaging vocabulary learning platform. The system prioritizes security through RLS, performance through Web Workers and caching, and user experience through real-time collaboration and intuitive UI.

# EduPuzzle - Codebase Architecture

**Last Updated:** 2025-11-17
**Total Files:** 61 TypeScript/React source files
**Total Lines:** ~2,700 lines of code
**Type Safety:** ✅ Strict mode enabled, 0 errors

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Data Flow](#data-flow)
5. [Module Details](#module-details)
6. [Function Reference](#function-reference)

---

## System Overview

EduPuzzle is a language learning application that uses **crossword puzzles** combined with a **Spaced Repetition System (SRS)** to help users memorize vocabulary. The app generates custom crossword puzzles from user vocabulary lists and tracks learning progress using the SM-2 algorithm.

### Core Features

- 📚 **Vocabulary Management**: Create and manage word lists with translations
- 🧩 **Puzzle Generation**: Advanced algorithm generates crossword puzzles from vocabulary
- 🧠 **Spaced Repetition**: SM-2 algorithm tracks and schedules word reviews
- 🎯 **Daily Practice**: Auto-generated puzzles based on due words
- 📊 **Progress Tracking**: Track learning progress, streaks, and review history

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND STACK                         │
├─────────────────────────────────────────────────────────────┤
│  React 18.3          │  UI Framework                        │
│  TypeScript 5        │  Type Safety (Strict Mode)           │
│  React Router 6      │  Client-side Routing                 │
│  React Query 5       │  Server State Management             │
│  Tailwind CSS 3      │  Styling                             │
│  Radix UI            │  Accessible Components               │
│  Vite                │  Build Tool & Dev Server             │
├─────────────────────────────────────────────────────────────┤
│                      BACKEND STACK                          │
├─────────────────────────────────────────────────────────────┤
│  Supabase            │  PostgreSQL Database + Auth          │
│  Row Level Security  │  Database-level Authorization        │
├─────────────────────────────────────────────────────────────┤
│                      ALGORITHMS                             │
├─────────────────────────────────────────────────────────────┤
│  SM-2 Algorithm      │  Spaced Repetition Scheduling        │
│  Custom Generator    │  Crossword Puzzle Generation         │
│  DFS Connectivity    │  Graph Validation                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  Dashboard   │  │ TodaysPuzzles│  │ PuzzleSolver │                   │
│  │              │  │              │  │              │                   │
│  │  - View Lists│  │  - Due Words │  │  - Play Grid │                   │
│  │  - Add Words │  │  - SRS Based │  │  - Check     │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                           │
│         └─────────────────┴─────────────────┘                           │
│                           │                                             │
│                           ▼                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                        REACT QUERY LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ useWordLists │  │useTodaysPuzls│  │usePuzzleSolver                   │
│  │              │  │              │  │              │                   │
│  │ - Fetch      │  │ - Generate   │  │ - Validate   │                   │
│  │ - Cache      │  │ - SRS Fetch  │  │ - Track      │                   │
│  │ - Invalidate │  │ - Update     │  │ - State Mgmt │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                           │
│         └─────────────────┴─────────────────┘                           │
│                           │                                             │
│                           ▼                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                         API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  wordLists   │  │     srs      │  │   puzzles    │                   │
│  │   API        │  │     API      │  │     API      │                   │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤                   │
│  │ getWordLists │  │fetchDueWords │  │getRandomWords│                   │
│  │createWordList│  │updateProgress│  │savePuzzle    │                   │
│  │updateWordList│  │calculateNext │  │              │                   │
│  │deleteWordList│  │batchUpdate   │  │              │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                           │
│         └─────────────────┴─────────────────┘                           │
│                           │                                             │
│                           ▼                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                    ALGORITHM LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────┐               │
│  │          Puzzle Generation Algorithm                 │               │
│  ├──────────────────────────────────────────────────────┤               │
│  │  clustering → placement → scoring → validation       │               │
│  │                                                      │               │
│  │  clusterWords()    │  Words grouped by similarity    │               │
│  │         ↓          │                                 │               │
│  │  generatePuzzle()  │  30 attempts with backtracking  │               │
│  │         ↓          │                                 │               │
│  │  findPlacements()  │  All crossing options           │               │
│  │         ↓          │                                 │               │
│  │  scorePlacement()  │  Crossing score, density, etc   │               │
│  │         ↓          │                                 │               │
│  │  isConnected()     │  DFS graph validation           │               │
│  │         ↓          │                                 │               │
│  │  cropToSquare()    │  Optimize grid bounds           │               │
│  └──────────────────────────────────────────────────────┘               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────┐               │
│  │          SM-2 Spaced Repetition Algorithm            │               │
│  ├──────────────────────────────────────────────────────┤               │
│  │  calculateNextReview()                               │               │
│  │    ├─ Update ease factor (1.3 - 2.5)                 │               │
│  │    ├─ Calculate interval days                        │               │
│  │    ├─ Update stage (New → Learning → Young → Mature) │               │
│  │    └─ Schedule next review date                      │               │
│  └──────────────────────────────────────────────────────┘               │
│                           │                                             │
│                           ▼                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                      DATABASE LAYER (Supabase)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │   users    │  │word_lists  │  │   words    │  │word_progress         │
│  ├────────────┤  ├────────────┤  ├────────────┤  ├────────────┤         │
│  │ id         │  │ id         │  │ id         │  │ id         │         │
│  │ email      │  │ user_id ───┼──┤ list_id ───┼──┤ word_id    │         │
│  │ sub_status │  │ name       │  │ term       │  │ stage      │         │
│  │ trial_end  │  │ src_lang   │  │ translation│  │ ease_factor│         │
│  └────────────┘  │ tgt_lang   │  │ definition │  │ interval   │         │
│                  └────────────┘  │ example    │  │ next_review│         │
│                                  └────────────┘  │ streak     │         │
│                                                  └────────────┘         │
│                         (Row Level Security Enabled)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Daily Puzzle Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   DAILY PUZZLE GENERATION                           │
└─────────────────────────────────────────────────────────────────────┘

User Opens TodaysPuzzles Page
          │
          ▼
┌──────────────────────────────┐
│  useTodaysPuzzles() hook     │
│  - Triggers on mount         │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  fetchDueWords(userId)       │──────────┐
│  - Query: word_progress      │          │ DATABASE QUERY
│  - Filter: next_review ≤ NOW │◄─────────┘
│  - Exclude: reviewed today   │
└──────────┬───────────────────┘
           │
           │  Returns: [WordWithProgress]
           │
           ▼
┌──────────────────────────────┐
│  smartGroupWords()           │
│  - Group by language pair    │
│  - Separate large lists (≥15)│
│  - Combine small lists (<15) │
└──────────┬───────────────────┘
           │
           │  Returns: [PuzzleGroup]
           │
           ▼
┌──────────────────────────────────────────────────────┐
│  For each group: generatePuzzles(words)              │
│                                                      │
│  ┌─────────────────────────────────────────────┐     │
│  │  1. clusterWords(words)                     │     │
│  │     - Calculate compatibility scores        │     │
│  │     - Group 8-15 words per cluster          │     │
│  │                                             │     │
│  │  2. For each cluster:                       │     │
│  │     generatePuzzle(clusterWords)            │     │
│  │       │                                     │     │
│  │       ├─ Try 30 different word orderings    │     │
│  │       │                                     │     │
│  │       ├─ For each word:                     │     │
│  │       │   ├─ findPlacements()               │     │
│  │       │   ├─ scorePlacement()               │     │
│  │       │   └─ grid.placeWord()               │     │
│  │       │                                     │     │
│  │       ├─ isConnected() validation           │     │
│  │       └─ cropToSquare() optimization        │     │
│  │                                             │     │
│  │  3. Redistribute failed words               │     │
│  │  4. Retry in smaller groups                 │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
│  Returns: [Puzzle] (99%+ word coverage)              │
└──────────┬───────────────────────────────────────────┘
           │
           │  Returns: Puzzle[]
           │
           ▼
┌──────────────────────────────┐
│  PuzzleGrid + PuzzleClues    │
│  Display puzzle to user      │
└──────────┬───────────────────┘
           │
           │  User solves puzzle
           │
           ▼
┌──────────────────────────────┐
│  handleEndPuzzle()           │
│  - validateAllWords()        │
│  - Calculate SRS updates     │
└──────────┬───────────────────┘
           │
           │  {wordId: wasCorrect}[]
           │
           ▼
┌──────────────────────────────────────────────┐
│  batchUpdateWordProgress(updates, userId)    │──────────┐
│  - For each word:                            │          │
│    ├─ Fetch current progress                 │          │ DATABASE
│    ├─ calculateNextReview(progress, correct) │          │ UPDATES
│    └─ Update database                        │◄─────────┘
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  queryClient.invalidate()    │
│  - Refetch due words         │
│  - Regenerate puzzles        │
└──────────┬───────────────────┘
           │
           ▼
     Next Puzzle or Complete!
```

### 2. SRS Update Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                 SPACED REPETITION SYSTEM (SM-2)                     │
└─────────────────────────────────────────────────────────────────────┘

Word Answered (Correct/Incorrect)
          │
          ▼
┌─────────────────────────────────────┐
│  calculateNextReview()              │
│  - Input: WordProgress, wasCorrect  │
└─────────┬───────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  1. Update Ease Factor                                 │
│     - Correct: +0.1 (max 2.5)                          │
│     - Perfect: +0.2                                    │
│     - Incorrect: -0.2 (min 1.3)                        │
│                                                        │
│  2. Calculate Interval Days                            │
│     - First correct: 1 day                             │
│     - Second correct: 6 days                           │
│     - Subsequent: interval * ease_factor               │
│     - Incorrect: Reset to 1 day                        │
│                                                        │
│  3. Update Stage                                       │
│     New (0) ─────correct────→ Learning (1)             │
│     Learning ───interval≥7───→ Young (2)               │
│     Young ──────interval≥30──→ Mature (3)              │
│     Mature ─────incorrect────→ Relearning (4)          │
│     Relearning ──correct──────→ Young (2)              │
│                                                        │
│  4. Calculate Next Review Date                         │
│     - today + interval_days                            │
│                                                        │
│  5. Update Statistics                                  │
│     - Increment total_reviews                          │
│     - Increment correct/incorrect_reviews              │
│     - Update current_streak                            │
└────────┬───────────────────────────────────────────────┘
         │
         │  Returns: Partial<WordProgress>
         │
         ▼
┌─────────────────────────────────────┐
│  Update Database                    │
│  - Save to word_progress table      │
│  - Set last_reviewed_at = today     │
└─────────────────────────────────────┘
```

### 3. Puzzle Generation Algorithm Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│            PUZZLE GENERATION ALGORITHM (DETAILED)                   │
└─────────────────────────────────────────────────────────────────────┘

Input: Word[] (30-50 words)
          │
          ▼
┌──────────────────────────────────────┐
│  clusterWords(words)                 │
│                                      │
│  For each word pair:                 │
│    ├─ Calculate shared letters       │
│    ├─ Count crossing potential       │
│    └─ Score compatibility (0-100)    │
│                                      │
│  Group into clusters (8-15 words):   │
│    - High compatibility scores       │
│    - Shared letter frequency         │
└─────────┬────────────────────────────┘
          │
          │  Returns: WordCluster[]
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│  For each cluster: generatePuzzle(words)                 │
│                                                          │
│  Attempt #1-30 (different word orderings):               │
│  ┌────────────────────────────────────────────────┐      │
│  │                                                │      │
│  │  1. Initialize Grid (starts at 16x16)          │      │
│  │                                                │      │
│  │  2. Place First Word (center)                  │      │
│  │     ├─ Place horizontally at grid center       │      │
│  │     └─ Mark cells with word ID                 │      │
│  │                                                │      │
│  │  3. For each remaining word:                   │      │
│  │     ┌─────────────────────────────────────┐    │      │
│  │     │  findPlacements(word, grid)         │    │      │
│  │     │    - For each placed word:          │    │      │
│  │     │      - Find matching letters        │    │      │
│  │     │      - Generate crossing positions  │    │      │
│  │     │    - Return: PlacementOption[]      │    │      │
│  │     └──────────┬──────────────────────────┘    │      │
│  │                │                               │      │
│  │                ▼                               │      │
│  │     ┌─────────────────────────────────────┐    │      │
│  │     │  scorePlacement(option, grid)       │    │      │
│  │     │  ┌──────────────────────────────┐   │    │      │
│  │     │  │ Crossing Count    weight=100 │   │    │      │
│  │     │  │ Grid Density      weight=50  │   │    │      │
│  │     │  │ Letter Rarity     weight=10  │   │    │      │
│  │     │  │ Center Proximity  weight=25  │   │    │      │
│  │     │  │ Bounding Box Pen. weight=15  │   │    │      │
│  │     │  └──────────────────────────────┘   │    │      │
│  │     │    Return: PlacementWithScore       │    │      │
│  │     └──────────┬──────────────────────────┘    │      │
│  │                │                               │      │
│  │                ▼                               │      │
│  │     ┌─────────────────────────────────────┐    │      │
│  │     │  getBestPlacement(placements)       │    │      │
│  │     │    - Sort by score (descending)     │    │      │
│  │     │    - Return top placement           │    │      │
│  │     └──────────┬──────────────────────────┘    │      │
│  │                │                               │      │
│  │                ▼                               │      │
│  │     ┌─────────────────────────────────────┐    │      │
│  │     │  grid.placeWord(placement)          │    │      │
│  │     │    - Validate no conflicts          │    │      │
│  │     │    - Update grid cells              │    │      │
│  │     │    - Track crossings                │    │      │
│  │     └─────────────────────────────────────┘    │      │
│  │                                                │      │
│  │  4. Validate Puzzle                            │      │
│  │     ┌─────────────────────────────────────┐    │      │
│  │     │  isConnected(grid)                  │    │      │
│  │     │    - Build word graph               │    │      │
│  │     │    - DFS traversal from first word  │    │      │
│  │     │    - Check all words visited        │    │      │
│  │     └─────────────────────────────────────┘    │      │
│  │                                                │      │
│  │  5. Optimize Grid                              │      │
│  │     ┌─────────────────────────────────────┐    │      │
│  │     │  cropToSquare(puzzle)               │    │      │
│  │     │    - Find min/max bounds            │    │      │
│  │     │    - Make square (max dimension)    │    │      │
│  │     │    - Ensure ≥ 8x8, ≤ 16x16          │    │      │
│  │     └─────────────────────────────────────┘    │      │
│  │                                                │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  If attempt succeeds: Return Puzzle                      │
│  If all attempts fail: Try backtracking                  │
│    - Remove last N words                                 │
│    - Retry with smaller word set                         │
└───────────┬──────────────────────────────────────────────┘
            │
            │  Returns: Puzzle | null
            │
            ▼
┌──────────────────────────────────────┐
│  Redistribute Failed Words           │
│  - Add failed words to other clusters│
│  - Retry puzzle generation           │
│  - Target: 99%+ word coverage        │
└──────────────────────────────────────┘
```

---

## Module Details

### Frontend Modules

#### Pages (src/pages/)

```
Dashboard.tsx (200 lines)
├─ Lists all word lists with word counts
├─ Shows due words count badge
├─ CRUD operations for word lists
└─ Navigates to: TodaysPuzzles, WordListDetail, PuzzleSolver

TodaysPuzzles.tsx (250 lines)
├─ Fetches due words via SRS
├─ Generates puzzles from due words
├─ Multi-puzzle session with progress tracking
├─ Updates SRS progress on completion
└─ Variables passed:
    ├─ puzzles: Puzzle[]
    ├─ currentPuzzleIndex: number
    ├─ userInput: Record<string, string>
    └─ completedPuzzles: Set<string>

PuzzleSolver.tsx (150 lines)
├─ Generates puzzle from word list
├─ Single/multi-puzzle navigation
├─ Does NOT update SRS (practice mode)
└─ Variables passed:
    ├─ listId: string (from route params)
    ├─ puzzle: Puzzle
    └─ wordCount: number (default 30)

WordListDetail.tsx (200 lines)
├─ Shows list info and all words
├─ CRUD operations for words
└─ Variables passed:
    ├─ listId: string (from route params)
    ├─ words: Word[]
    └─ list: WordList

LandingPage.tsx
├─ Marketing landing page
└─ Call-to-action to signup

LoginPage.tsx / SignupPage.tsx
├─ Authentication forms
└─ Variables: email, password

Settings/*.tsx
├─ Account settings
└─ Subscription management
```

#### Components (src/components/)

```
puzzle/
  PuzzleGrid.tsx (400 lines) ★★★ COMPLEX
  ├─ 2D grid rendering (8x8 to 16x16)
  ├─ Keyboard navigation (arrows, tab, enter)
  ├─ Cell selection and input
  ├─ Visual word highlighting
  ├─ Variables received:
  │   ├─ puzzle: Puzzle
  │   ├─ userInput: Record<string, string>
  │   ├─ selectedWord: PlacedWord | null
  │   ├─ onCellChange: (coord, letter) => void
  │   ├─ onWordSelect: (word) => void
  │   └─ showCorrectAnswers: boolean
  └─ Variables passed to parent:
      ├─ cellCoord: string (x,y format)
      └─ letter: string

  PuzzleClues.tsx (200 lines)
  ├─ Displays across/down clues
  ├─ Clue selection highlights word in grid
  ├─ Check, Hint, End buttons
  ├─ Variables received:
  │   ├─ puzzle: Puzzle
  │   ├─ selectedWord: PlacedWord | null
  │   ├─ onClueSelect: (word) => void
  │   ├─ onCheck: () => void
  │   ├─ onHint: () => void
  │   └─ onEnd: () => void
  └─ Variables passed to parent:
      └─ selectedWord: PlacedWord

  PuzzleCompletionCard.tsx
  ├─ Shows completion stats
  └─ Variables received:
      ├─ totalWords: number
      ├─ correctWords: number
      ├─ hintsUsed: number
      └─ onContinue: () => void

words/
  CreateWordListDialog.tsx
  ├─ Form to create new word list
  └─ Variables: name, source_language, target_language

  CreateWordDialog.tsx
  ├─ Form to add word to list
  └─ Variables: term, translation, definition, exampleSentence

  LanguageSelector.tsx
  ├─ Dropdown for language selection
  └─ Variables: sourceLanguage, targetLanguage

layout/
  AppLayout.tsx
  ├─ Main layout wrapper with navigation
  └─ Variables: children

  ProfileMenu.tsx
  ├─ User dropdown menu
  └─ Variables: user: User | null

auth/
  LoginForm.tsx / SignupForm.tsx
  ├─ Authentication forms
  └─ Variables: email, password

  ProtectedRoute.tsx
  ├─ Route guard requiring authentication
  └─ Variables: children

ui/ (Radix UI components)
  ├─ button.tsx, card.tsx, dialog.tsx, etc.
  └─ Styled component primitives
```

#### Hooks (src/hooks/)

```
useAuth.ts
├─ Real-time authentication state
├─ Variables:
│   ├─ user: User | null
│   ├─ loading: boolean
│   └─ signIn/signOut/signUp functions
└─ Returns: { user, loading, signIn, signOut, signUp }

useTodaysPuzzles.ts ★★★ COMPLEX
├─ Fetches due words
├─ Generates puzzles via SRS
├─ Variables:
│   ├─ dueWords: WordWithProgress[]
│   ├─ puzzles: Puzzle[]
│   ├─ isGenerating: boolean
│   └─ completePuzzle: (updates) => void
└─ Returns: { puzzles, isLoading, completePuzzle }

usePuzzleGeneration.ts
├─ Generates puzzles from word list
├─ Variables:
│   ├─ listId: string
│   ├─ wordCount: number
│   ├─ enabled: boolean
│   ├─ puzzles: Puzzle[]
│   └─ isLoading: boolean
└─ Returns: { puzzles, isLoading, error }

usePuzzleSolver.ts
├─ Shared puzzle solving logic
├─ Variables:
│   ├─ puzzle: Puzzle
│   ├─ userInput: Record<string, string>
│   ├─ selectedWord: PlacedWord | null
│   ├─ checkedWords: Record<string, 'correct' | 'incorrect'>
│   ├─ hintsRemaining: number
│   └─ isPuzzleCompleted: boolean
└─ Returns: { ...state, ...actions }

useWordLists.ts
├─ Fetches and manages word lists
├─ Variables:
│   ├─ wordLists: WordList[]
│   ├─ isLoading: boolean
│   ├─ createWordList: (name, src, tgt) => void
│   ├─ updateWordList: (id, updates) => void
│   └─ deleteWordList: (id) => void
└─ Returns: { wordLists, isLoading, ...mutations }

useWords.ts
├─ Fetches and manages words in a list
├─ Variables:
│   ├─ words: Word[]
│   ├─ isLoading: boolean
│   ├─ createWord: (word) => void
│   ├─ updateWord: (id, updates) => void
│   └─ deleteWord: (id) => void
└─ Returns: { words, isLoading, ...mutations }

useWordListsWithCounts.ts
├─ Fetches word lists with word counts
├─ Uses parallel queries for performance
└─ Returns: { wordListsWithCounts, isLoading }
```

### Backend Modules

#### API Layer (src/lib/api/)

```
wordLists.ts
├─ getWordLists() → WordList[]
│   └─ Query: word_lists WHERE user_id = current_user
│
├─ getWordList(id) → WordList
│   └─ Query: word_lists WHERE id = id
│
├─ createWordList(name, src_lang, tgt_lang) → WordList
│   └─ Insert: word_lists with user_id
│
├─ updateWordList(id, updates) → WordList
│   └─ Update: word_lists WHERE id = id
│
└─ deleteWordList(id) → void
    └─ Delete: word_lists WHERE id = id (cascade to words)

words.ts
├─ getWords(listId) → Word[]
│   └─ Query: words WHERE list_id = listId ORDER BY created_at ASC
│
├─ getWord(id) → Word
│   └─ Query: words WHERE id = id
│
├─ createWord(word) → Word
│   └─ Insert: words with validation
│
├─ createWords(words) → Word[]
│   └─ Insert: words (bulk)
│
├─ updateWord(id, updates) → Word
│   └─ Update: words WHERE id = id
│
├─ deleteWord(id) → void
│   └─ Delete: words WHERE id = id
│
└─ deleteWords(ids) → void
    └─ Delete: words WHERE id IN ids

puzzles.ts
├─ getRandomWordsForPuzzle(listId, count=30) → Word[]
│   ├─ Query: words WHERE list_id = listId
│   ├─ Shuffle client-side
│   └─ Return: Word[]
│
└─ savePuzzleSession(userId, listId, puzzles) → PuzzleSession
    ├─ Insert: puzzle_sessions
    └─ Return: PuzzleSession with id

srs.ts ★★★ COMPLEX
├─ fetchDueWords(userId) → WordWithProgress[]
│   ├─ Query: words JOIN word_lists JOIN word_progress
│   ├─ Filter: next_review_date ≤ TODAY
│   ├─ Filter: last_reviewed_at != TODAY
│   ├─ Filter: user_id = userId
│   └─ Return: WordWithProgress[]
│
├─ fetchDueWordsCount(userId) → number
│   └─ Return: count of due words
│
├─ updateWordProgress(wordId, userId, wasCorrect) → void
│   ├─ Fetch: current word_progress
│   ├─ Calculate: next review via calculateNextReview()
│   ├─ Update: word_progress table
│   └─ Variables passed:
│       ├─ wordId: string
│       ├─ userId: string
│       └─ wasCorrect: boolean
│
├─ batchUpdateWordProgress(updates, userId) → void
│   ├─ For each update: call updateWordProgress()
│   └─ Variables: updates: Array<{wordId, wasCorrect}>
│
└─ calculateNextReview(progress, wasCorrect) → Partial<WordProgress>
    ├─ SM-2 Algorithm Implementation
    ├─ Update: ease_factor (1.3 - 2.5)
    ├─ Calculate: interval_days
    ├─ Update: stage (0-4)
    ├─ Calculate: next_review_date
    └─ Return: {
        ease_factor, interval_days, stage,
        next_review_date, total_reviews,
        correct_reviews, incorrect_reviews,
        current_streak, last_reviewed_at
      }
```

#### Algorithm Layer (src/lib/algorithms/)

```
generator.ts ★★★★ VERY COMPLEX
├─ generatePuzzles(words) → Puzzle[]
│   ├─ clusterWords(words) → WordCluster[]
│   ├─ For each cluster: generatePuzzle(words)
│   ├─ redistributeFailedWords()
│   ├─ retryFailedWords()
│   └─ Return: Puzzle[] (99%+ word coverage)
│
├─ generatePuzzle(words, config) → Puzzle | null
│   ├─ Try 30 attempts with different orderings
│   ├─ For each attempt: generatePuzzleAttempt()
│   ├─ If failed and multi-puzzle: backtracking
│   └─ Return: Puzzle | null
│
├─ generatePuzzleAttempt(words, config) → Puzzle | null
│   ├─ Initialize Grid
│   ├─ Place first word (center)
│   ├─ For each word:
│   │   ├─ findPlacements(word, grid)
│   │   ├─ scorePlacement(placement, grid)
│   │   ├─ getBestPlacement(placements)
│   │   └─ grid.placeWord(placement)
│   ├─ isConnected(grid) validation
│   ├─ cropToSquare(puzzle)
│   └─ Return: Puzzle | null
│
└─ Variables passed between functions:
    ├─ words: Word[]
    ├─ grid: Grid
    ├─ config: PuzzleConfig
    ├─ placedWords: PlacedWord[]
    └─ failedWords: Word[]

clustering.ts
├─ clusterWords(words, minSize=8, maxSize=15) → WordCluster[]
│   ├─ For each word pair:
│   │   ├─ getSharedLetterCount(w1, w2) → number
│   │   ├─ getCrossingPotential(w1, w2) → number
│   │   └─ getCompatibilityScore(w1, w2) → number
│   ├─ Group words by compatibility
│   └─ Return: WordCluster[]
│
└─ Variables: words: Word[]

placement.ts
├─ findPlacements(word, grid, placedWords) → PlacementOption[]
│   ├─ If first word: getFirstWordPlacements()
│   ├─ Else: findCrossingPlacements()
│   └─ Return: PlacementOption[]
│
├─ getFirstWordPlacements(word, grid) → PlacementOption[]
│   └─ Return: [{ x: center, y: center, direction: 'across' }]
│
└─ findCrossingPlacements(word, grid, placedWords) → PlacementOption[]
    ├─ For each placed word:
    │   ├─ Find matching letters
    │   └─ Generate placement options
    └─ Return: PlacementOption[]

scoring.ts
├─ scorePlacement(placement, grid) → PlacementWithScore
│   ├─ Crossing count × 100
│   ├─ Grid density × 50
│   ├─ Letter rarity × 10
│   ├─ Center proximity × 25
│   ├─ Bounding box penalty × 15
│   └─ Return: { ...placement, score }
│
└─ getBestPlacement(placements) → PlacementOption | null
    ├─ Sort by score (descending)
    └─ Return: placements[0]

connectivity.ts
├─ isConnected(grid) → boolean
│   ├─ buildWordGraph(grid)
│   ├─ DFS from first word
│   └─ Return: all words visited?
│
└─ findIslands(grid) → string[][]
    └─ Return: disconnected word groups

grid.ts
├─ Grid class
│   ├─ constructor(size) → Grid
│   ├─ canPlaceWord(word, x, y, direction) → boolean
│   ├─ placeWord(word, x, y, direction) → PlacedWord
│   ├─ getPlacedWords() → PlacedWord[]
│   └─ exportGrid() → string[][]
│
└─ Variables:
    ├─ cells: Cell[][]
    ├─ placedWords: PlacedWord[]
    └─ size: number

types.ts
└─ Type definitions for algorithm internals
```

---

## Function Reference

### Critical Function Signatures

#### Authentication

```typescript
// src/lib/auth.ts
signUp(email: string, password: string) → Promise<User>
signIn(email: string, password: string) → Promise<User>
signOut() → Promise<void>
getCurrentUser() → Promise<User | null>
```

#### Word Lists

```typescript
// src/lib/api/wordLists.ts
getWordLists() → Promise<WordList[]>
createWordList(name, src_lang, tgt_lang) → Promise<WordList>
updateWordList(id, updates) → Promise<WordList>
deleteWordList(id) → Promise<void>
```

#### Words

```typescript
// src/lib/api/words.ts
getWords(listId) → Promise<Word[]>
createWord(word: Omit<Word, 'id'>) → Promise<Word>
updateWord(id, updates) → Promise<Word>
deleteWord(id) → Promise<void>
createWords(words: Omit<Word, 'id'>[]) → Promise<Word[]>
```

#### Puzzles

```typescript
// src/lib/api/puzzles.ts
getRandomWordsForPuzzle(listId, count=30) → Promise<Word[]>
savePuzzleSession(userId, listId, puzzles) → Promise<PuzzleSession>
```

#### SRS

```typescript
// src/lib/api/srs.ts
fetchDueWords(userId) → Promise<WordWithProgress[]>
fetchDueWordsCount(userId) → Promise<number>
updateWordProgress(wordId, userId, wasCorrect) → Promise<void>
batchUpdateWordProgress(updates, userId) → Promise<void>
calculateNextReview(progress, wasCorrect) → Partial<WordProgress>
```

#### Puzzle Generation

```typescript
// src/lib/algorithms/generator.ts
generatePuzzles(words, config?) → Promise<Puzzle[]>
generatePuzzle(words, config?) → Promise<Puzzle | null>

// src/lib/algorithms/clustering.ts
clusterWords(words, minSize?, maxSize?) → WordCluster[]
getCompatibilityScore(word1, word2) → number

// src/lib/algorithms/placement.ts
findPlacements(word, grid, placedWords) → PlacementOption[]
findCrossingPlacements(word, grid, placedWords) → PlacementOption[]

// src/lib/algorithms/scoring.ts
scorePlacement(placement, grid, weights?) → PlacementWithScore
getBestPlacement(placements) → PlacementOption | null

// src/lib/algorithms/connectivity.ts
isConnected(grid) → boolean
findIslands(grid) → string[][]

// src/lib/algorithms/grid.ts
class Grid {
  canPlaceWord(word, x, y, direction) → boolean
  placeWord(word, x, y, direction) → PlacedWord
  getPlacedWords() → PlacedWord[]
  exportGrid() → string[][]
}
```

#### React Hooks

```typescript
// src/hooks/useAuth.ts
useAuth() → {
  user: User | null
  loading: boolean
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email, password) => Promise<void>
}

// src/hooks/useTodaysPuzzles.ts
useTodaysPuzzles() → {
  puzzles: Puzzle[]
  isLoading: boolean
  error: Error | null
  completePuzzle: (updates) => Promise<void>
}

// src/hooks/usePuzzleGeneration.ts
usePuzzleGeneration(listId, wordCount, enabled) → {
  puzzles: Puzzle[]
  isLoading: boolean
  error: Error | null
}

// src/hooks/usePuzzleSolver.ts
usePuzzleSolver(puzzle) → {
  userInput: Record<string, string>
  selectedWord: PlacedWord | null
  focusedCell: { x, y } | null
  hintsRemaining: number
  checkedWords: Record<string, 'correct' | 'incorrect'>
  isPuzzleCompleted: boolean
  showCorrectAnswers: boolean
  handleCellChange: (coord, letter) => void
  handleWordSelect: (word) => void
  handleCheck: () => void
  handleHint: () => void
  handleEnd: () => void
  resetPuzzle: () => void
}

// src/hooks/useWordLists.ts
useWordLists() → {
  wordLists: WordList[]
  isLoading: boolean
  createWordList: (name, src, tgt) => Promise<WordList>
  updateWordList: (id, updates) => Promise<WordList>
  deleteWordList: (id) => Promise<void>
}

// src/hooks/useWords.ts
useWords(listId) → {
  words: Word[]
  isLoading: boolean
  createWord: (word) => Promise<Word>
  updateWord: (id, updates) => Promise<Word>
  deleteWord: (id) => Promise<void>
}
```

---

## Type Definitions

### Core Domain Types (src/types/index.ts)

```typescript
// User & Auth
interface User {
  id: string
  email: string
  createdAt: string
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  trialEndDate: string
  subscriptionEndDate?: string
}

// Vocabulary
interface Word {
  id: string
  listId: string
  term: string
  translation: string
  definition?: string
  exampleSentence?: string
  createdAt: string
}

interface WordList {
  id: string
  user_id: string
  name: string
  source_language: string
  target_language: string
  created_at: string
  updated_at: string
}

interface WordWithProgress extends Word {
  listId: string
  listName: string
  source_language: string
  target_language: string
  progress?: WordProgress
}

// SRS
enum SRSStage {
  New = 0,
  Learning = 1,
  Young = 2,
  Mature = 3,
  Relearning = 4,
}

interface WordProgress {
  id: string
  userId: string
  wordId: string
  stage: SRSStage
  easeFactor: number // 1.3 - 2.5
  intervalDays: number
  nextReviewDate: string // ISO date
  lastReviewedAt: string | null
  totalReviews: number
  correctReviews: number
  incorrectReviews: number
  currentStreak: number
  updatedAt: string
}

type ReviewType = 'perfect' | 'half_known' | 'conditional' | 'unknown' | 'not_evaluated'

// Puzzles
interface Puzzle {
  id: string
  gridSize: number // 8-16
  placedWords: PlacedWord[]
  grid: string[][] // 2D array of letters
}

interface PlacedWord {
  word: Word
  clue: string // translation + definition
  x: number
  y: number
  direction: 'across' | 'down'
  number: number // Clue number
  crossings: Crossing[]
}

interface Crossing {
  position: number // Position in this word
  otherWordId: string
  otherWordPosition: number
}

interface PuzzleSession {
  id: string
  userId: string
  listId?: string
  startedAt: string
  completedAt?: string
  puzzleData: Puzzle[]
  totalWords: number
  correctWords: number
}

// Algorithm Types
interface PuzzleConfig {
  maxGridSize: number // Default: 16
  minGridSize: number // Default: 8
  timeoutMs: number // Default: 10000
  minCrossingsPerWord: number // Default: 1
  maxAttemptsPerWord: number // Default: 100
}

interface PlacementOption {
  x: number
  y: number
  direction: 'across' | 'down'
  crossings: number
}

interface PlacementWithScore extends PlacementOption {
  score: number
}

interface WordCluster {
  words: Word[]
  difficulty: 'easy' | 'medium' | 'hard'
}
```

---

## Database Schema

### Tables

```sql
-- Users (managed by Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'trial',
  trial_end_date TIMESTAMP,
  subscription_end_date TIMESTAMP
);

-- Word Lists
CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Words
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Word Progress (SRS)
CREATE TABLE word_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  stage INTEGER DEFAULT 0 CHECK (stage >= 0 AND stage <= 4),
  ease_factor DECIMAL(3,2) DEFAULT 2.50 CHECK (ease_factor >= 1.30 AND ease_factor <= 2.50),
  interval_days INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_reviewed_at DATE,
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  incorrect_reviews INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, word_id)
);

-- Puzzle Sessions
CREATE TABLE puzzle_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  list_id UUID REFERENCES word_lists(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  puzzle_data JSONB NOT NULL,
  total_words INTEGER NOT NULL,
  correct_words INTEGER DEFAULT 0
);

-- Word Reviews
CREATE TABLE word_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES puzzle_sessions(id),
  word_id UUID REFERENCES words(id),
  user_id UUID REFERENCES users(id),
  review_type TEXT NOT NULL,
  time_to_solve INTEGER,
  hints_used INTEGER DEFAULT 0,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_word_progress_due_words
  ON word_progress(user_id, next_review_date)
  WHERE next_review_date <= CURRENT_DATE;

CREATE INDEX idx_words_list_id ON words(list_id);
CREATE INDEX idx_word_lists_user_id ON word_lists(user_id);
```

### Row Level Security Policies

```sql
-- Users can only see their own word lists
CREATE POLICY word_lists_user_policy ON word_lists
  USING (user_id = auth.uid());

-- Users can only see words from their lists
CREATE POLICY words_user_policy ON words
  USING (list_id IN (
    SELECT id FROM word_lists WHERE user_id = auth.uid()
  ));

-- Users can only see their own word progress
CREATE POLICY word_progress_user_policy ON word_progress
  USING (user_id = auth.uid());

-- Users can only see their own puzzle sessions
CREATE POLICY puzzle_sessions_user_policy ON puzzle_sessions
  USING (user_id = auth.uid());
```

---

## Performance Optimizations

### 1. React Optimization

```
- React.memo() on PuzzleGrid (reduces 256+ renders)
- useMemo() for cell maps and computations
- React Query caching (5 min staleTime)
- Parallel queries for word list counts
```

### 2. Database Optimization

```
- Indexed lookups on next_review_date
- RLS policies push security to database
- Bulk insert/update operations
- Count-only queries with head: true
```

### 3. Algorithm Optimization

```
- 30 attempts with different orderings
- Clustering reduces problem space
- Early exit when all words placed
- Backtracking only on 2+ puzzles
```

### 4. Build Optimization

```
- Vite for fast HMR and builds
- Code splitting (automatic)
- Tree shaking for unused code
- Minification in production
```

---

## Configuration

### Environment Variables

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_ENABLE_DEBUG_LOGS=true  # Optional
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Puzzle Generation Defaults

```typescript
DEFAULT_CONFIG = {
  maxGridSize: 16,
  minGridSize: 8,
  timeoutMs: 10000,
  minCrossingsPerWord: 1,
  maxAttemptsPerWord: 100,
}

DEFAULT_WEIGHTS = {
  crossingCount: 100,
  gridDensity: 50,
  letterRarity: 10,
  symmetry: 25,
  boundingBoxPenalty: 15,
}
```

---

## Summary Statistics

| Metric                  | Value          |
| ----------------------- | -------------- |
| **Total Source Files**  | 61             |
| **Total Lines of Code** | ~2,700         |
| **Pages**               | 8              |
| **Components**          | 18             |
| **Custom Hooks**        | 6              |
| **API Functions**       | 12             |
| **Algorithm Files**     | 7              |
| **Database Tables**     | 7              |
| **Routes**              | 10             |
| **Type Definitions**    | 14+            |
| **Type Safety**         | ✅ Strict mode |
| **Type Errors**         | 0              |

---

## Recent Cleanup (2025-11-17)

### Files Deleted

- ❌ `src/lib/srs/engine.ts` - Legacy SRS engine (unused)
- ❌ `src/hooks/useLazyPuzzles.ts` - Unused lazy loading (unused)
- ❌ `src/pages/DailyReview.tsx` - Stub page (no functionality)
- ❌ `src/pages/Statistics.tsx` - Stub page (no functionality)

### Functions Removed

- ❌ `getAllWordsFromList()` in puzzles.ts (unused)
- ❌ `getPuzzleSession()` in puzzles.ts (unused)
- ❌ `completePuzzleSession()` in puzzles.ts (unused)

### Type Errors Fixed

- ✅ Database types updated for word_progress table (SM-2 fields)
- ✅ Supabase type inference issues resolved (cast workarounds)
- ✅ Radix UI Dialog props type issues fixed
- ✅ Unused variables and imports removed

### Code Quality

- ✅ All TypeScript errors resolved
- ✅ ESLint errors resolved
- ✅ No unused code detected
- ✅ Strict mode enabled and enforced

---

**End of Documentation**

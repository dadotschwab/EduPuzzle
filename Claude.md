# Project Context
EDU-PUZZLE is a vocabulary learning web application that generates personalized crossword puzzles from user-created word lists, utilizing spaced repetition for optimal learning retention.

## Quick Commands
When working on this project, you can use these shortcuts:

@generate-puzzle-algo - Work on crossword generation algorithm
@srs-logic - Implement spaced repetition system
@fix-connectivity - Debug grid connectivity issues
@stripe-webhook - Set up payment webhooks
@optimize-performance - Improve generation speed

---

# Tech Stack Reference

```yaml
Frontend:
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
```

---

# React Performance Guidelines (MANDATORY)

## When to Optimize Components

**ALWAYS apply these optimizations to components that**:
- Render frequently (>10 times per user interaction)
- Perform calculations in render (array operations, filtering, mapping)
- Have more than 5 props
- Render lists with >20 items
- Handle user input (forms, interactive grids, etc.)

## Required Optimizations

### 1. Wrap Components with React.memo
```typescript
// ✅ ALWAYS use memo for components that receive props
export const WordListCard = memo(function WordListCard({ list, onSelect }) {
  // Component logic
})

// ✅ ALWAYS use memo for list item components
export const GridCell = memo(function GridCell({ value, onChange }) {
  // Cell logic
})
```

### 2. Memoize Expensive Calculations with useMemo
```typescript
// ❌ BAD: Recalculates on every render
function WordList({ words }) {
  const sortedWords = words.sort((a, b) => a.term.localeCompare(b.term))
  const activeWords = sortedWords.filter(w => w.active)

// ✅ GOOD: Only recalculates when words changes
function WordList({ words }) {
  const sortedWords = useMemo(
    () => words.sort((a, b) => a.term.localeCompare(b.term)),
    [words]
  )

  const activeWords = useMemo(
    () => sortedWords.filter(w => w.active),
    [sortedWords]
  )
```

**Common use cases for useMemo**:
- Array filtering, sorting, or mapping
- Object transformations
- Complex calculations
- Building lookup maps/sets from arrays

### 3. Stabilize Callbacks with useCallback
```typescript
// ❌ BAD: New function reference every render (causes child re-renders)
function Parent() {
  const handleClick = (id: string) => {
    console.log(id)
  }

  return <Child onClick={handleClick} />
}

// ✅ GOOD: Stable function reference
function Parent() {
  const handleClick = useCallback((id: string) => {
    console.log(id)
  }, [])

  return <Child onClick={handleClick} />
}
```

### 4. Avoid Inline Objects/Arrays in JSX
```typescript
// ❌ BAD: New object/array every render
<Component
  style={{ margin: 10, padding: 20 }}
  items={[1, 2, 3]}
/>

// ✅ GOOD: Stable references
const buttonStyle = { margin: 10, padding: 20 }
const defaultItems = [1, 2, 3]

<Component
  style={buttonStyle}
  items={defaultItems}
/>
```

### 5. Pre-calculate Maps for Lookups
```typescript
// ❌ BAD: O(n) lookup in render for each item
function Grid({ cells, selectedId }) {
  return cells.map(cell => (
    <Cell
      key={cell.id}
      selected={cell.id === selectedId}  // O(1) comparison is fine
      word={words.find(w => w.id === cell.wordId)}  // ❌ O(n) search!
    />
  ))
}

// ✅ GOOD: O(1) lookup with pre-calculated map
function Grid({ cells, selectedId, words }) {
  const wordMap = useMemo(() => {
    const map = new Map()
    words.forEach(w => map.set(w.id, w))
    return map
  }, [words])

  return cells.map(cell => (
    <Cell
      key={cell.id}
      selected={cell.id === selectedId}
      word={wordMap.get(cell.wordId)}  // ✅ O(1) lookup
    />
  ))
}
```

## Performance Red Flags

Watch out for these patterns:
- ⚠️ **Nested loops in render methods** → Extract to useMemo
- ⚠️ **Array operations without useMemo** → Cache the result
- ⚠️ **Functions defined inside render** → Use useCallback
- ⚠️ **Large lists without virtualization** → Consider react-window
- ⚠️ **Inline object/array literals in props** → Extract to constants

---

# Code Reuse & DRY Principle (MANDATORY)

## Duplication Rules

- **Never duplicate >10 lines of code** - Extract to a helper function
- **Never duplicate >3 lines more than twice** - Create a reusable utility
- **If logic appears in 2+ places** - It belongs in a shared function

## Refactoring Checklist

Before committing code, check for:
- [ ] Identical or near-identical code blocks
- [ ] Similar validation logic in multiple places
- [ ] Repeated data transformations
- [ ] Copy-pasted error handling

## Examples

### ❌ BAD: Duplicated validation
```typescript
async function createWord(data: WordInput) {
  // Validation logic
  if (!data.term || data.term.length === 0) {
    throw new Error('Term is required')
  }
  if (!data.translation || data.translation.length === 0) {
    throw new Error('Translation is required')
  }
  if (data.term.length > 100) {
    throw new Error('Term too long')
  }

  return await db.words.create(data)
}

async function updateWord(id: string, data: WordInput) {
  // Same validation logic (DUPLICATED!)
  if (!data.term || data.term.length === 0) {
    throw new Error('Term is required')
  }
  if (!data.translation || data.translation.length === 0) {
    throw new Error('Translation is required')
  }
  if (data.term.length > 100) {
    throw new Error('Term too long')
  }

  return await db.words.update(id, data)
}
```

### ✅ GOOD: Extracted helper
```typescript
function validateWordInput(data: WordInput): void {
  if (!data.term || data.term.length === 0) {
    throw new Error('Term is required')
  }
  if (!data.translation || data.translation.length === 0) {
    throw new Error('Translation is required')
  }
  if (data.term.length > 100) {
    throw new Error('Term too long')
  }
}

async function createWord(data: WordInput) {
  validateWordInput(data)
  return await db.words.create(data)
}

async function updateWord(id: string, data: WordInput) {
  validateWordInput(data)
  return await db.words.update(id, data)
}
```

### ✅ EVEN BETTER: Reusable validation utility
```typescript
// lib/utils/validation.ts
export function validate<T>(
  data: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: string[] = []

  for (const rule of rules) {
    if (!rule.check(data)) {
      errors.push(rule.message)
    }
  }

  return { valid: errors.length === 0, errors }
}

// Usage
const wordValidationRules = [
  { check: (d) => d.term?.length > 0, message: 'Term is required' },
  { check: (d) => d.translation?.length > 0, message: 'Translation is required' },
  { check: (d) => d.term?.length <= 100, message: 'Term too long' }
]

const result = validate(wordData, wordValidationRules)
```

---

# Algorithm Performance Standards

## Computational Complexity Targets

- **Interactive operations** (user input, UI updates): O(1) or O(log n)
- **Data processing** (filtering, mapping): O(n) maximum
- **Puzzle generation**: O(n log n) preferred, O(n²) acceptable
- **❌ AVOID**: O(n³) or higher without caching

## Caching Strategies

### 1. Use WeakMap for Object-Keyed Caches
```typescript
// Automatically garbage collected when object is removed
const gridCache = new WeakMap<Grid, ProcessedData>()

function processGrid(grid: Grid): ProcessedData {
  // Check cache first
  const cached = gridCache.get(grid)
  if (cached) return cached

  // Expensive computation
  const result = expensiveGridOperation(grid)

  // Cache for next time
  gridCache.set(grid, result)
  return result
}
```

### 2. Use Map for Primitive-Keyed Caches
```typescript
const wordScoreCache = new Map<string, number>()

function getWordScore(word: string): number {
  if (wordScoreCache.has(word)) {
    return wordScoreCache.get(word)!
  }

  const score = calculateComplexScore(word)
  wordScoreCache.set(word, score)
  return score
}
```

### 3. Use useMemo in React Components
```typescript
function PuzzleAnalyzer({ puzzle }) {
  // Cache expensive analysis
  const statistics = useMemo(() => {
    return analyzeConnectivity(puzzle) // Only runs when puzzle changes
  }, [puzzle])

  return <Stats data={statistics} />
}
```

## Algorithm Optimization Patterns

### Pattern 1: Pre-calculate and Cache
```typescript
// ❌ BAD: Recalculate for each placement
function scorePlacement(word: string, grid: Grid) {
  let total = 0
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      if (grid.cells[y][x]) {  // Scanning entire grid every time!
        total += calculateDistance(word, x, y)
      }
    }
  }
  return total
}

// ✅ GOOD: Cache filled cells
const filledCellsCache = new WeakMap<Grid, Coord[]>()

function getFilledCells(grid: Grid): Coord[] {
  const cached = filledCellsCache.get(grid)
  if (cached) return cached

  const filled: Coord[] = []
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      if (grid.cells[y][x]) {
        filled.push({ x, y })
      }
    }
  }

  filledCellsCache.set(grid, filled)
  return filled
}

function scorePlacement(word: string, grid: Grid) {
  const filled = getFilledCells(grid)  // Cached O(1) or one-time O(n²)
  return filled.reduce((sum, coord) =>
    sum + calculateDistance(word, coord.x, coord.y), 0
  )  // Now O(k) where k = filled cells
}
```

### Pattern 2: Avoid Nested Loops
```typescript
// ❌ BAD: O(n × m)
function findCrossings(word: string, placedWords: Word[]): Crossing[] {
  const crossings: Crossing[] = []
  for (let i = 0; i < word.length; i++) {
    for (const placed of placedWords) {
      for (let j = 0; j < placed.word.length; j++) {
        if (word[i] === placed.word[j]) {
          crossings.push({ position: i, otherPosition: j })
        }
      }
    }
  }
  return crossings
}

// ✅ GOOD: O(n + m) with letter position map
function findCrossings(word: string, placedWords: Word[]): Crossing[] {
  // Build letter position maps O(m)
  const letterMap = new Map<string, number[]>()
  placedWords.forEach(placed => {
    placed.word.split('').forEach((letter, idx) => {
      if (!letterMap.has(letter)) letterMap.set(letter, [])
      letterMap.get(letter)!.push({ wordId: placed.id, position: idx })
    })
  })

  // Find crossings O(n)
  const crossings: Crossing[] = []
  word.split('').forEach((letter, i) => {
    const matches = letterMap.get(letter) || []
    matches.forEach(match => {
      crossings.push({ position: i, otherPosition: match.position })
    })
  })

  return crossings
}
```

## Performance Red Flags

- ⚠️ **Triple nested loops** → O(n³) complexity
- ⚠️ **Repeated array.filter()** → Cache the result
- ⚠️ **Grid scanning in loops** → Cache filled cells
- ⚠️ **Same calculation in loop** → Move outside loop or cache

---

# Code Quality Rules

## TypeScript Strict Mode
Always enabled - NO EXCEPTIONS

## Type Safety (ZERO TOLERANCE for `any`)

**❌ NEVER use `any` types** - Use these alternatives instead:

### 1. For Dynamic Objects → Create an Interface
```typescript
// ❌ BAD
function updateRecord(id: string, updates: any) {
  const data: any = {}
  if (updates.name) data.name = updates.name
  if (updates.email) data.email = updates.email
  return db.update(id, data)
}

// ✅ GOOD
interface UpdateData {
  name?: string
  email?: string
  age?: number
}

function updateRecord(id: string, updates: UpdateData) {
  const data: UpdateData = {}
  if (updates.name !== undefined) data.name = updates.name
  if (updates.email !== undefined) data.email = updates.email
  return db.update(id, data)
}
```

### 2. For Unknown Types → Use `unknown` + Type Guards
```typescript
// ❌ BAD
function processApiResponse(data: any) {
  return data.results.map((item: any) => item.name)
}

// ✅ GOOD
interface ApiResponse {
  results: Array<{ name: string; id: string }>
}

function isApiResponse(data: unknown): data is ApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'results' in data &&
    Array.isArray((data as any).results)
  )
}

function processApiResponse(data: unknown) {
  if (!isApiResponse(data)) {
    throw new Error('Invalid API response')
  }

  return data.results.map(item => item.name)  // TypeScript knows the type!
}
```

### 3. For Generic Types → Use Proper Generics
```typescript
// ❌ BAD
function getProperty(obj: any, key: string): any {
  return obj[key]
}

// ✅ GOOD
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// Usage - fully typed!
const user = { name: 'Alice', age: 30 }
const name = getProperty(user, 'name')  // Type: string
const age = getProperty(user, 'age')    // Type: number
```

## Type Safety Enforcement

- Enable `"noImplicitAny": true` in tsconfig.json
- Run ESLint with `@typescript-eslint/no-explicit-any: "error"`
- Code reviews must reject any `any` types
- Use `unknown` when you truly don't know the type

## Other Quality Standards

- **Error Boundaries**: Wrap all major components
- **Loading States**: Every async operation must show loading UI
- **Optimistic Updates**: For better UX in mutations
- **Accessibility**: ARIA labels, keyboard navigation

---

# React Component Patterns

## State Management Guidelines

### Avoid Derived State
```typescript
// ❌ BAD: Derived state can get out of sync
function WordList({ words }) {
  const [filteredWords, setFilteredWords] = useState(words)
  const [searchTerm, setSearchTerm] = useState('')

  // Bug: forgetting to update filteredWords when words changes!

// ✅ GOOD: Calculate derived data in render or useMemo
function WordList({ words }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredWords = useMemo(
    () => words.filter(w => w.term.includes(searchTerm)),
    [words, searchTerm]
  )
```

### Colocate State
```typescript
// ❌ BAD: State far from usage
function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState(null)

  return (
    <Dashboard>
      <Sidebar />
      <Content />
      <Footer>
        <Modal open={modalOpen} data={modalData} />
      </Footer>
    </Dashboard>
  )
}

// ✅ GOOD: State close to usage
function App() {
  return (
    <Dashboard>
      <Sidebar />
      <Content />
      <Footer>
        <ModalSection />  {/* State lives here */}
      </Footer>
    </Dashboard>
  )
}

function ModalSection() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)

  return <Modal open={open} data={data} />
}
```

## Component Composition

### Prefer Composition Over Prop Drilling
```typescript
// ❌ BAD: Prop drilling
function App() {
  const theme = useTheme()
  return <Parent theme={theme} />
}

function Parent({ theme }) {
  return <Child theme={theme} />
}

function Child({ theme }) {
  return <GrandChild theme={theme} />
}

// ✅ GOOD: Context or composition
function App() {
  return (
    <ThemeProvider>
      <Parent />
    </ThemeProvider>
  )
}

function GrandChild() {
  const theme = useTheme()  // Access directly
  return <div style={theme.styles} />
}
```

## Hooks Best Practices

### Always Include All Dependencies
```typescript
// ❌ BAD: Missing dependencies
function Component({ userId }) {
  const fetchUser = useCallback(() => {
    return api.getUser(userId)  // userId not in deps!
  }, [])

// ✅ GOOD: All dependencies listed
function Component({ userId }) {
  const fetchUser = useCallback(() => {
    return api.getUser(userId)
  }, [userId])  // userId dependency added
```

### Extract Complex Logic to Custom Hooks
```typescript
// ❌ BAD: Complex logic in component
function PuzzleView({ listId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [puzzle, setPuzzle] = useState(null)

  useEffect(() => {
    setLoading(true)
    generatePuzzle(listId)
      .then(setPuzzle)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [listId])

  // ... render logic
}

// ✅ GOOD: Extract to custom hook
function usePuzzleGeneration(listId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [puzzle, setPuzzle] = useState(null)

  useEffect(() => {
    setLoading(true)
    generatePuzzle(listId)
      .then(setPuzzle)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [listId])

  return { puzzle, loading, error }
}

function PuzzleView({ listId }) {
  const { puzzle, loading, error } = usePuzzleGeneration(listId)

  // ... simple render logic
}
```

---

# JSDoc Documentation Standards

All code must be well-documented:

## File-Level Documentation
Every file MUST have a `@fileoverview` header:
```typescript
/**
 * @fileoverview Word list management API functions
 *
 * Provides CRUD operations for vocabulary word lists with support for
 * filtering, sorting, and bulk operations.
 *
 * @module lib/api/wordLists
 */
```

## Function Documentation
All exported functions MUST have JSDoc comments:
```typescript
/**
 * Fetches all word lists for the current user
 *
 * @param userId - The unique user identifier
 * @param options - Optional filtering and sorting options
 * @returns Promise resolving to array of word lists
 * @throws {AuthError} If user is not authenticated
 * @throws {DatabaseError} If database query fails
 *
 * @example
 * const lists = await getWordLists('user-123', {
 *   sortBy: 'created_at',
 *   order: 'desc'
 * })
 */
export async function getWordLists(
  userId: string,
  options?: QueryOptions
): Promise<WordList[]> {
  // Implementation
}
```

## Complex Logic Documentation
Add inline comments explaining the "why":
```typescript
// Check connectivity using DFS to ensure no isolated word islands
// This is critical for puzzle solvability
const connected = isConnected(grid)
if (!connected) {
  logger.warn('Disconnected puzzle detected - will retry placement')
}
```

---

# Critical Constraints

## Puzzle Generation MUST:
- Include ALL due words (100% coverage)
- Maintain grid connectivity (no islands)
- Complete in <5 seconds
- Generate multiple puzzles if needed for all words

## Business Rules:
- 7-day free trial, then subscription-only
- €6.99/month pricing
- No freemium features
- Desktop-first design

## Technical Constraints:
- No Python (TypeScript/JavaScript only)
- Avoid expensive operations (keep costs < revenue)
- ChromeOS/Crostini compatible development

---

# Database Schema Summary

```sql
Key Tables:
- users (subscription_status, trial_end_date)
- word_lists (user's vocabulary collections)
- words (term, translation, definition)
- word_progress (SRS tracking per user/word)
- puzzle_sessions (generated puzzles)
- word_reviews (individual word performance)

Key Indexes:
- word_progress(user_id, next_review_date)
- puzzle_sessions(user_id, started_at DESC)
```

---

# Database Naming Conventions (MANDATORY)

## Use snake_case for Database Fields

**ALWAYS use snake_case in TypeScript interfaces that map to database tables**. This prevents conversion overhead and maintains consistency with Supabase/PostgreSQL conventions.

### ❌ BAD: Using camelCase (requires conversion)
```typescript
interface WordList {
  id: string
  userId: string           // Database has user_id
  sourceLanguage: string   // Database has source_language
  targetLanguage: string   // Database has target_language
  createdAt: string        // Database has created_at
}

// Requires conversion layer
function rowToWordList(row: any): WordList {
  return {
    id: row.id,
    userId: row.user_id,           // Manual conversion
    sourceLanguage: row.source_language,  // Manual conversion
    targetLanguage: row.target_language,  // Manual conversion
    createdAt: row.created_at      // Manual conversion
  }
}
```

### ✅ GOOD: Using snake_case (direct mapping)
```typescript
interface WordList {
  id: string
  user_id: string          // Matches database exactly
  source_language: string  // Matches database exactly
  target_language: string  // Matches database exactly
  created_at: string       // Matches database exactly
}

// No conversion needed - data flows directly
const { data } = await supabase.from('word_lists').select('*')
return data as WordList[]  // Direct type assertion, no conversion
```

## Benefits of snake_case Convention

1. **No conversion overhead** - Data flows directly from database to app
2. **Fewer bugs** - Eliminates potential for conversion errors
3. **Simpler code** - No need for mapping functions
4. **Consistency** - Matches PostgreSQL and Supabase conventions
5. **Better DX** - Database queries and TypeScript types match exactly

## When to Use snake_case

- ✅ All TypeScript interfaces for database tables
- ✅ API function parameters that map to database columns
- ✅ React component props when passing database fields
- ✅ State variables that hold database records

## When camelCase is Acceptable

- ✅ Internal component state (not from database)
- ✅ Computed/derived values
- ✅ Event handlers and callbacks
- ✅ Local variables and functions

---

# Algorithm Specifications

## Crossword Generation Core Logic

```typescript
// CRITICAL: Use Incremental Best-Fit, NOT backtracking
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
}
```

## Spaced Repetition Intervals

```typescript
const intervals = [1, 3, 7, 14, 30, 90, 180] // days

ReviewTypes:
- 'perfect': next interval
- 'half_known': next interval
- 'conditional': same interval
- 'unknown': reset to day 1
- 'not_evaluated': no change (>70% revealed)
```

---

# UI/UX Design Principles

## Content Width Consistency
All pages must use consistent maximum width:
- Use `max-w-7xl mx-auto` for all page content containers
- Use responsive padding: `px-4 sm:px-6 lg:px-8 py-8`
- This ensures content aligns with the navbar width and maintains visual consistency
- Applies to: Dashboard, Word Lists, Settings, and all other pages

## Sticky Navigation Elements
Important navigation should remain visible:
- Settings sidebar uses `sticky top-20 self-start` to stay visible on scroll
- Navbar is sticky with `sticky top-0` for consistent access to profile/settings

---

# Component Structure

```
src/
├── components/
│   ├── puzzle/
│   │   ├── Grid.tsx          // Interactive crossword grid (MUST use memo)
│   │   ├── Clues.tsx         // Across/Down hints
│   │   └── Controls.tsx      // Check/Submit/Hint buttons
│   ├── words/
│   │   ├── ListManager.tsx   // CRUD for word lists
│   │   └── WordInput.tsx     // Add/edit words
│   └── subscription/
│       └── CheckoutFlow.tsx  // Stripe integration
├── lib/
│   ├── algorithms/
│   │   ├── generator.ts      // Puzzle generation (cache filled cells!)
│   │   ├── connectivity.ts   // Grid validation
│   │   └── clustering.ts     // Word grouping
│   └── srs/
│       └── engine.ts         // Spaced repetition logic
└── hooks/
    ├── usePuzzle.ts         // Puzzle state management
    └── useSubscription.ts   // Payment state
```

---

# Common Issues & Solutions

## Issue: Puzzle generation timeout
```typescript
// Solution: Use time-bounded generation
const puzzle = await Promise.race([
  generatePuzzle(words),
  new Promise((_, reject) =>
    setTimeout(() => reject('timeout'), 5000)
  )
])
// Fallback: Split words into smaller groups
```

## Issue: Words won't cross
```typescript
// Solution: Use letter frequency analysis
function scoreCrossingPotential(word1: string, word2: string) {
  const common = intersection(
    new Set(word1),
    new Set(word2)
  )
  return common.size * avgLetterFrequency(common)
}
```

## Issue: Subscription webhook failures
```typescript
// Always verify Stripe signatures
const sig = req.headers.get('stripe-signature')
if (!verifyWebhookSignature(payload, sig)) {
  return new Response('Invalid signature', { status: 400 })
}

// Implement idempotency
if (await hasProcessedEvent(event.id)) {
  return new Response('Already processed', { status: 200 })
}
```

---

# Development Workflow

## Initial Setup

```bash
# Clone and install
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
```

## Git Branch Strategy

```bash
main          # Production
├── staging   # Pre-production testing
└── dev       # Active development
    └── feature/* # Individual features
```

## Testing Commands

```bash
pnpm test:unit      # Algorithm tests
pnpm test:int       # API tests
pnpm test:e2e       # User flow tests
pnpm test:generate  # Puzzle generation benchmarks
```

---

# Performance Optimization Checklist

- [ ] Implement Web Worker for puzzle generation
- [ ] Add Redis caching for frequently accessed words
- [ ] Use database connection pooling
- [ ] Lazy load puzzle solver component
- [ ] Implement virtual scrolling for large word lists
- [ ] Pre-generate next day's puzzles in background
- [ ] Use React.memo for all list components
- [ ] Use useMemo for all expensive calculations
- [ ] Use useCallback for all event handlers
- [ ] Batch API calls in React Query

---

# Supabase Edge Function Templates

## Generate Puzzle Endpoint

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
```

---

# Debugging Helpers

## Log Puzzle Generation

```typescript
if (process.env.NODE_ENV === 'development') {
  console.group('🧩 Puzzle Generation')
  console.log('Words:', words.length)
  console.log('Grid size:', grid.size)
  console.log('Placements:', placements)
  console.log('Connectivity:', isConnected)
  console.groupEnd()
}
```

## Visualize Grid in Console

```typescript
function debugGrid(grid: Grid) {
  const visual = grid.cells.map(row =>
    row.map(cell => cell.letter || '⬛').join(' ')
  ).join('\n')
  console.log(visual)
}
```

---

# Production Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Stripe webhook endpoint verified
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Database backups scheduled
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (Plausible) implemented
- [ ] SSL certificate active
- [ ] Environment variables secured
- [ ] Database indexes optimized
- [ ] RLS policies tested
- [ ] Edge function cold starts optimized
- [ ] All components use React.memo where appropriate
- [ ] No `any` types in codebase
- [ ] All expensive calculations use useMemo
- [ ] All callbacks use useCallback

---

# Common SQL Queries

```sql
-- Get today's due words for user
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
```

---

# External Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Subscription Webhooks](https://stripe.com/docs/billing/subscriptions/webhooks)
- [React Query Patterns](https://tanstack.com/query/latest/docs/react/guides/queries)
- [Crossword Generation Papers](https://scholar.google.com/scholar?q=crossword+puzzle+generation)

---

# Contact & Support

- **GitHub Issues**: [repo]/issues
- **Documentation**: [repo]/wiki
- **Developer**: David (ChromeOS/Crostini environment)

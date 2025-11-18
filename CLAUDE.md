# EDU-PUZZLE Development Guidelines

## Project Overview
EDU-PUZZLE: Vocabulary learning app combining crossword puzzles with spaced repetition. Desktop-first web app using React/TypeScript frontend with Supabase backend.

## Tech Stack
```yaml
Frontend: React 18 + Vite + TypeScript 5 + TailwindCSS + shadcn/ui
State: Zustand (local) + React Query (server)
Backend: Supabase (PostgreSQL + Auth + Edge Functions)
Payments: Stripe (subscription model)
```

---

## 🎯 Core Architecture Principles

### 1. Server-First Decision Tree
```
Is it CRUD? → Direct Supabase Client
Is it <100ms computation? → Client-side OK
Is it complex/non-deterministic? → Edge Function
Does it need consistency across users? → Edge Function
Is it cacheable? → Edge Function with caching
```

### 2. Data Flow
```
Client → React Query → Supabase/Edge Function → Response
Never: Client → Fetch → Process → Use (causes race conditions)
```

### 3. Business Logic Location
- **Client**: UI state, form validation, display logic only
- **Edge Functions**: All business logic, complex algorithms, SRS calculations
- **Database**: Data integrity, RLS policies, constraints

---

## 📝 TypeScript Standards

### Strict Mode Required
```typescript
// tsconfig.json must have:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Everything
```typescript
// ❌ BAD
const handleSubmit = (data) => { ... }
const [state, setState] = useState()

// ✅ GOOD
const handleSubmit = (data: WordInput): Promise<void> => { ... }
const [state, setState] = useState<PuzzleState>()
```

### Use Type Guards
```typescript
// Define once, use everywhere
function isValidWord(word: unknown): word is Word {
  return typeof word === 'object' && 
         word !== null &&
         'term' in word &&
         'translation' in word
}

// Usage
if (isValidWord(data)) {
  // TypeScript knows data is Word here
}
```

---

## ⚛️ React Performance (MANDATORY)

### Always Memoize Components with Props
```typescript
// ✅ REQUIRED for all components with props
export const WordCard = memo(({ word, onClick }: Props) => {
  return <div onClick={onClick}>{word.term}</div>
})
```

### Use useMemo for Computations
```typescript
// ✅ REQUIRED for array operations in render
const sortedWords = useMemo(
  () => words.sort((a, b) => a.term.localeCompare(b.term)),
  [words]
)

// ✅ REQUIRED for lookups
const wordMap = useMemo(() => {
  const map = new Map<string, Word>()
  words.forEach(w => map.set(w.id, w))
  return map
}, [words])
```

### Use useCallback for Event Handlers
```typescript
// ✅ REQUIRED for all callbacks passed as props
const handleClick = useCallback((id: string) => {
  console.log(id)
}, []) // Add dependencies if needed
```

### Never Create Objects/Arrays Inline
```typescript
// ❌ BAD
<Component style={{ margin: 10 }} items={[1, 2, 3]} />

// ✅ GOOD
const style = { margin: 10 }
const items = [1, 2, 3]
<Component style={style} items={items} />
```

---

## 🏗️ Code Organization

### Project Structure
```
/src
  /components   # Presentational only, no business logic
  /pages        # Route components, thin wrappers
  /hooks        # Data fetching (React Query), UI state
  /lib
    /api        # Supabase client wrappers
    /utils      # Pure functions only
  /types        # All TypeScript types

/supabase
  /functions    # Business logic, algorithms
  /migrations   # Schema, RLS policies
```

### Component Pattern
```typescript
// components/WordCard.tsx
export const WordCard = memo(({ word, onEdit }: WordCardProps) => {
  // Only UI logic
  return (
    <Card onClick={() => onEdit(word.id)}>
      <h3>{word.term}</h3>
      <p>{word.translation}</p>
    </Card>
  )
})

// hooks/useWords.ts
export function useWords(listId: string) {
  // Data fetching only
  return useQuery({
    queryKey: ['words', listId],
    queryFn: () => supabase.from('words').select('*').eq('list_id', listId)
  })
}
```

---

## 🔄 DRY & Refactoring Rules

### Duplication Thresholds
- **>10 lines**: Always extract to function
- **>3 lines repeated twice**: Create utility
- **Any logic in 2+ places**: Extract to shared module

### Mandatory Refactoring Points
1. **Before switching features**: Check for duplication
2. **After implementing feature**: Extract shared patterns
3. **When copy-pasting**: Stop and refactor first

### Extraction Patterns
```typescript
// ❌ BAD: Validation duplicated
async function createWord(data: WordInput) {
  if (!data.term) throw new Error('Term required')
  if (data.term.length > 100) throw new Error('Term too long')
  // ... more validation
}

async function updateWord(id: string, data: WordInput) {
  if (!data.term) throw new Error('Term required')
  if (data.term.length > 100) throw new Error('Term too long')
  // ... same validation
}

// ✅ GOOD: Extracted validation
const validateWord = (data: WordInput): void => {
  if (!data.term) throw new Error('Term required')
  if (data.term.length > 100) throw new Error('Term too long')
}

async function createWord(data: WordInput) {
  validateWord(data)
  return supabase.from('words').insert(data)
}

async function updateWord(id: string, data: WordInput) {
  validateWord(data)
  return supabase.from('words').update(data).eq('id', id)
}
```

---

## 🎮 Algorithm Patterns

### Puzzle Generation (Server-Side)
```typescript
// Edge Function: /supabase/functions/generate-puzzle
export async function generatePuzzle(words: Word[], seed: string) {
  // 1. Check cache first
  const cached = await getCached(seed)
  if (cached) return cached
  
  // 2. Generate with deterministic seed
  const rng = createSeededRandom(seed)
  const puzzle = await generate(words, rng)
  
  // 3. Cache result
  await cache(seed, puzzle)
  return puzzle
}
```

### SRS Calculation (Server-Side)
```typescript
// Edge Function: /supabase/functions/calculate-srs
const intervals = [1, 3, 7, 14, 30, 90, 180] // days

export function calculateNext(level: number, performance: ReviewType) {
  switch (performance) {
    case 'perfect':
    case 'half_known':
      return Math.min(level + 1, intervals.length - 1)
    case 'conditional':
      return level
    case 'unknown':
      return 0
    case 'not_evaluated':
      return level // No change
  }
}
```

---

## ✅ Pre-Commit Checklist

### Code Quality
- [ ] No `any` types
- [ ] All components memoized
- [ ] All calculations in `useMemo`
- [ ] All callbacks in `useCallback`
- [ ] No duplicate code blocks
- [ ] Business logic in Edge Functions

### Performance
- [ ] Lists use virtualization if >50 items
- [ ] Heavy computations in Web Workers or server
- [ ] Images lazy-loaded
- [ ] Bundle size checked

### Security
- [ ] RLS policies enabled
- [ ] Input validation on server
- [ ] No secrets in client code
- [ ] CORS configured

---

## 🚨 Red Flags

**Move to Server Immediately If:**
- Same input gives different outputs
- Fighting race conditions
- Takes >100ms on client
- Multiple users need same result
- Complex state invalidation logic

**Refactor Immediately If:**
- Copying code between files
- Similar components with minor differences
- Repeated validation/transformation logic
- Nested loops in render

---

## 📊 Error Handling Pattern

```typescript
// Consistent error handling across the app
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
  }
}

// Usage in Edge Function
try {
  const result = await riskyOperation()
  return new Response(JSON.stringify(result))
} catch (error) {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: error.statusCode }
    )
  }
  // Log unexpected errors
  console.error('Unexpected error:', error)
  return new Response('Internal error', { status: 500 })
}

// Client-side handling
const { mutate } = useMutation({
  mutationFn: updateWord,
  onError: (error) => {
    if (error.code === 'VALIDATION_ERROR') {
      toast.error('Please check your input')
    } else {
      toast.error('Something went wrong')
    }
  }
})
```

---

## 🎯 Quick Reference

### Component Template
```typescript
import { memo, useCallback, useMemo } from 'react'

interface Props {
  data: Item[]
  onAction: (id: string) => void
}

export const Component = memo(({ data, onAction }: Props) => {
  const processed = useMemo(() => 
    data.filter(d => d.active).sort(sortFn),
    [data]
  )
  
  const handleClick = useCallback((id: string) => {
    onAction(id)
  }, [onAction])
  
  return (
    <div>
      {processed.map(item => (
        <Item key={item.id} onClick={() => handleClick(item.id)} />
      ))}
    </div>
  )
})

Component.displayName = 'Component'
```

### Edge Function Template
```typescript
import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req: Request) => {
  try {
    // 1. Validate input
    const { data } = await req.json()
    if (!isValid(data)) {
      return new Response('Invalid input', { status: 400 })
    }
    
    // 2. Business logic
    const result = await processBusinessLogic(data)
    
    // 3. Return response
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal error', { status: 500 })
  }
})
```

---

**Remember:** Clean code > Clever code. When in doubt, choose readability and maintainability.

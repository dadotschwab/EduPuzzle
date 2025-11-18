# EduPuzzle - Architectural Guidelines

**Last Updated:** 2025-11-18
**Purpose:** Establish clear architectural patterns to prevent technical debt and ensure scalable, maintainable code.

---

## 🎯 Core Principles

### 1. **Server-First for Complex Operations**

**Rule:** Any operation meeting these criteria MUST run server-side:

- ✅ **Complex computation** (>100ms execution time)
- ✅ **Non-deterministic** (random results without seed)
- ✅ **Cacheable results** (same input → should get same output)
- ✅ **CPU-intensive** (algorithms, data processing)
- ✅ **Requires consistency** (multiple users should see same result for same data)

**Examples:**
- ✅ Puzzle generation → **SERVER** (Edge Function)
- ✅ SRS calculations → **SERVER** (Edge Function or DB function)
- ❌ UI state management → Client
- ❌ Form validation → Client (with server backup)

---

### 2. **Data Flow Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    CORRECT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client (React)                                             │
│    ↓                                                         │
│    └─ Fetch/Mutate (React Query)                           │
│         ↓                                                    │
│         ├─ Simple CRUD → Direct DB query (Supabase)        │
│         └─ Complex logic → Edge Function                    │
│                              ↓                               │
│                              ├─ Fetch data from DB          │
│                              ├─ Apply business logic        │
│                              ├─ Cache if needed             │
│                              └─ Return processed result     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Anti-pattern:**
```
❌ Client fetches raw data → Client processes → Client uses result
   (This leads to race conditions, performance issues, inconsistency)
```

**Correct pattern:**
```
✅ Client requests processed data → Server processes → Client displays
   (Single source of truth, cacheable, consistent)
```

---

### 3. **When to Use What**

| Operation Type | Implementation | Tool |
|---------------|----------------|------|
| **Create/Read/Update/Delete** | Direct DB query | Supabase Client |
| **Simple filtering/sorting** | DB query with filters | Supabase Client |
| **Complex queries (joins, aggregations)** | DB function or Edge Function | PostgreSQL Function or Edge Function |
| **Business logic** | Edge Function | Supabase Edge Functions |
| **Real-time data** | Realtime subscriptions | Supabase Realtime |
| **File uploads** | Storage | Supabase Storage |
| **Authentication** | Supabase Auth | Supabase Auth |

---

## 🚨 Red Flags (Move to Server!)

If you encounter these during development, **STOP** and move logic to server:

1. 🚩 **"Same input gives different output"**
   - Problem: Non-deterministic client-side generation
   - Solution: Server-side with seed/cache

2. 🚩 **"Fighting race conditions"**
   - Problem: Complex client state invalidation
   - Solution: Server manages state, client just displays

3. 🚩 **"This takes >1 second on client"**
   - Problem: Heavy computation blocking UI
   - Solution: Move to Edge Function with loading state

4. 🚩 **"Need to keep results consistent across sessions"**
   - Problem: Client-side generation differs per session
   - Solution: Server-side caching

5. 🚩 **"Multiple users should see the same thing"**
   - Problem: Client-side personalization
   - Solution: Server-side with user-specific parameters

---

## 📊 Decision Tree: Client vs Server

```
┌─────────────────────────────────────────┐
│  Is it a simple CRUD operation?         │
│  (Create, Read, Update, Delete)          │
└─────────┬───────────────────────────────┘
          │
    Yes ──┤
          │
          ▼
    ┌─────────────────────────────────────┐
    │  Use Supabase Client (Direct DB)    │ ✅
    └─────────────────────────────────────┘

    No ───┤
          │
          ▼
    ┌─────────────────────────────────────┐
    │  Does it involve computation?        │
    │  (algorithms, aggregations, etc.)    │
    └─────────┬───────────────────────────┘
              │
        Yes ──┤
              │
              ▼
        ┌─────────────────────────────────┐
        │  Is it <100ms and deterministic? │
        └─────────┬───────────────────────┘
                  │
            Yes ──┤
                  │
                  ▼
            ┌─────────────────────────────┐
            │  Client-side is OK          │ ✅
            │  (e.g., form validation)    │
            └─────────────────────────────┘

            No ───┤
                  │
                  ▼
            ┌─────────────────────────────┐
            │  Use Edge Function          │ ✅
            │  (server-side computation)  │
            └─────────────────────────────┘
```

---

## 🏗️ Architecture Patterns

### Pattern 1: Cached Server-Side Generation

**Use Case:** Expensive computation that should be consistent

```typescript
// ✅ GOOD: Server generates and caches
export async function getTodaysPuzzles() {
  // 1. Check cache
  const cached = await getCachedPuzzles(userId, wordIds)
  if (cached) return cached

  // 2. Generate if not cached
  const puzzles = await generatePuzzles(words)

  // 3. Store in cache
  await cachePuzzles(userId, wordIds, puzzles)

  return puzzles
}
```

```typescript
// ❌ BAD: Client generates each time
export function useTodaysPuzzles() {
  const { data: words } = useQuery(['dueWords'], fetchDueWords)

  // This runs on every render/refetch - BAD!
  const puzzles = useMemo(() => generatePuzzles(words), [words])

  return puzzles
}
```

---

### Pattern 2: Optimistic Updates with Server Authority

**Use Case:** Immediate UI feedback, but server is source of truth

```typescript
// ✅ GOOD: Optimistic update with rollback
const mutation = useMutation({
  mutationFn: updateWordProgress,
  onMutate: async (newData) => {
    // Optimistic update
    await queryClient.cancelQueries(['wordProgress'])
    const previous = queryClient.getQueryData(['wordProgress'])
    queryClient.setQueryData(['wordProgress'], newData)
    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['wordProgress'], context.previous)
  },
  onSuccess: () => {
    // Server confirms - invalidate to get fresh data
    queryClient.invalidateQueries(['wordProgress'])
  }
})
```

---

### Pattern 3: Deterministic Generation with Seeds

**Use Case:** Random-looking results that should be reproducible

```typescript
// ✅ GOOD: Seeded randomization
function generatePuzzle(words: Word[], options: { seed: string }) {
  const rng = createSeededRandom(options.seed) // Deterministic

  for (let i = 0; i < 30; i++) {
    const shuffled = shuffle(words, rng) // Same seed = same shuffle
    // ... rest of generation
  }
}

// Usage
const seed = wordIds.sort().join('|') // Same words = same seed
const puzzle = generatePuzzle(words, { seed })
```

```typescript
// ❌ BAD: Non-deterministic
function generatePuzzle(words: Word[]) {
  for (let i = 0; i < 30; i++) {
    const shuffled = words.sort(() => Math.random() - 0.5) // Different every time!
  }
}
```

---

## 🔒 Security Guidelines

### 1. **Never Trust Client Input**

```typescript
// ❌ BAD: Client sends computed result
const updateScore = async (score: number) => {
  await supabase.from('scores').insert({ score })
}

// ✅ GOOD: Server computes result
const completeGame = async (answers: Answer[]) => {
  // Server validates and computes score
  const result = await supabase.functions.invoke('complete-game', {
    body: { answers }
  })
}
```

### 2. **Row Level Security Always On**

- ✅ Every table MUST have RLS policies
- ✅ Test policies with different user contexts
- ✅ Never use service role key on client

### 3. **Validate on Server**

- ✅ Input validation in Edge Functions
- ✅ Business rule enforcement in DB constraints
- ✅ Client validation is UX only, not security

---

## 📦 Project Structure

```
/src
  /components     # Presentational components only
  /pages          # Page components (thin, delegate to hooks)
  /hooks          # React Query hooks (data fetching only)
  /lib
    /api          # Client API wrappers (thin layer over Supabase)
    /utils        # Pure utility functions (no side effects)
  /types          # TypeScript types

/supabase
  /functions      # Edge Functions (business logic, complex operations)
  /migrations     # Database migrations (schema, RLS, functions)
```

**Rules:**
- Components: No business logic, only presentation
- Hooks: Data fetching and React state only
- Business logic: Edge Functions or database functions
- Utils: Pure functions, no side effects

---

## ✅ Code Review Checklist

Before merging any feature, verify:

- [ ] Complex computation is server-side
- [ ] No race conditions in state management
- [ ] Deterministic results for same inputs
- [ ] Proper error handling and rollback
- [ ] RLS policies protect data access
- [ ] No sensitive logic on client
- [ ] TypeScript strict mode passes
- [ ] Performance: <100ms for UI interactions
- [ ] Caching strategy for expensive operations
- [ ] Loading states for async operations

---

## 🎓 Learning from Past Mistakes

### Case Study 1: Puzzle Generation

**Mistake:** Client-side puzzle generation
- ❌ Non-deterministic (different puzzle each refresh)
- ❌ Race conditions on invalidation
- ❌ Slow performance (blocks UI thread)
- ❌ Complex client state management

**Fix:** Server-side generation with caching
- ✅ Deterministic (same words = same puzzle)
- ✅ No race conditions (just fetch)
- ✅ Fast (cached results)
- ✅ Simple client code

**Lesson:** If it's complex and cacheable → Server-side

---

## 🔄 Refactoring Guidelines

When you identify code that violates these guidelines:

1. **Assess impact:** How many users are affected?
2. **Plan migration:** Can we do it incrementally?
3. **Add tests:** Before refactoring
4. **Migrate:** Move logic to server
5. **Simplify client:** Remove now-unnecessary complexity
6. **Monitor:** Check performance/errors after deploy

---

## 📚 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Remember:** When in doubt, ask:
1. Should multiple users see the same result? → Server
2. Is this expensive to compute? → Server
3. Is this deterministic? If no → Add seed and move to server
4. Am I fighting race conditions? → Rethink architecture

**Architecture is cheaper to fix early than later!**

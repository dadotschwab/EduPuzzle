# EDU-PUZZLE Project Specification

## 1. Product Overview
**EDU-PUZZLE**: Desktop-first vocabulary learning webapp combining crossword puzzles with spaced repetition.
- **Model**: 7-day trial → €6.99/month subscription (no freemium)
- **Target**: Students learning vocabulary in any language
- **USP**: Gamified spaced repetition through automatically generated crossword puzzles

---

## 2. Technical Stack & Architecture

### Stack
```yaml
Frontend:
  Framework: React 18 + Vite + TypeScript 5
  Styling: TailwindCSS + shadcn/ui
  State: Zustand (local) + React Query (server)
  
Backend:
  Database: Supabase (PostgreSQL)
  Auth: Supabase Auth
  Functions: Supabase Edge Functions (Deno)
  
Payments:
  Provider: Stripe
  Model: Subscription with 7-day trial
  
Hosting:
  Frontend: Netlify CDN
  Backend: Supabase Cloud
```

### Architecture Principles

#### Server-First Decision Tree
```
Simple CRUD? → Direct Supabase Client
<100ms computation? → Client-side OK
Complex/Non-deterministic? → Edge Function
Needs consistency? → Edge Function with caching
Heavy computation? → Edge Function + Web Worker
```

#### Data Flow Pattern
```
✅ CORRECT: Client → React Query → Edge Function → Process → Cache → Return
❌ WRONG: Client → Fetch Data → Process Client-Side → Use
```

---

## 3. Database Schema

```sql
-- Core Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'trial',
  subscription_end_date TIMESTAMP,
  trial_end_date TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  stripe_customer_id TEXT
);

CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES word_lists(id) ON DELETE CASCADE,
  term TEXT NOT NULL,        -- Word to place (e.g., "APPLE")
  translation TEXT NOT NULL,  -- Clue (e.g., "A fruit")
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
  list_id UUID REFERENCES word_lists(id) ON DELETE CASCADE,
  puzzle_data JSONB NOT NULL,
  total_words INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies (MANDATORY for all tables)
ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own lists" ON word_lists
  FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Core Algorithms

### 4.1 Puzzle Generation (Server-Side Edge Function)

```typescript
// Phase 1: Word Clustering
function clusterWords(words: Word[]): Word[][] {
  // Group by letter frequency overlap
  const letterWeights = {
    'e': 1, 'n': 1, 'r': 1,  // Common
    'q': 3, 'x': 3, 'z': 3   // Rare
  }
  
  // Target: 10-15 words per puzzle
  return optimizedClusters
}

// Phase 2: Placement with Connectivity
function generatePuzzle(words: Word[], seed: string): Puzzle {
  const rng = createSeededRandom(seed) // Deterministic
  const grid = new Grid(15) // 15x15 default
  
  // Place first word centered
  placeWord(grid, words[0], center, 'horizontal')
  
  // Place remaining words ensuring crossings
  for (const word of words.slice(1)) {
    const placements = findValidPlacements(word, grid)
    if (placements.length === 0) {
      // Move to next puzzle if can't place
      return splitIntoPuzzles(words)
    }
    placeBest(grid, word, placements)
  }
  
  // Verify connectivity (no islands)
  if (!isFullyConnected(grid)) {
    throw new Error('Disconnected puzzle')
  }
  
  return { grid, words: placedWords }
}
```

### 4.2 Spaced Repetition System

```typescript
// Intervals: 1, 3, 7, 14, 30, 90, 180 days
const SRS_INTERVALS = [1, 3, 7, 14, 30, 90, 180]

// Review Types based on performance
type ReviewType = 
  | 'perfect'        // Correct immediately
  | 'half_known'     // Wrong at check, correct at submit
  | 'conditional'    // 30-70% revealed
  | 'unknown'        // Wrong at submit
  | 'not_evaluated'  // >70% revealed

function calculateNext(level: number, review: ReviewType): number {
  switch (review) {
    case 'perfect':
    case 'half_known':
      return Math.min(level + 1, SRS_INTERVALS.length - 1)
    case 'conditional':
      return level // Stay same
    case 'unknown':
      return 0 // Reset
    case 'not_evaluated':
      return level // No change
  }
}
```

---

## 5. API Endpoints (Edge Functions)

### Generate Daily Puzzles
```typescript
// POST /functions/generate-puzzles
{
  userId: string,
  listId?: string // Optional: specific list
}

// Response
{
  sessions: [{
    id: string,
    puzzleData: Puzzle,
    wordCount: number
  }]
}
```

### Submit Review
```typescript
// POST /functions/submit-review
{
  sessionId: string,
  wordReviews: [{
    wordId: string,
    reviewType: ReviewType,
    hintsUsed: number
  }]
}
```

---

## 6. UI/UX Standards

### Layout Consistency
```tsx
// ALL pages must use this pattern
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Content */}
</div>
```

### Navigation
- Navbar: `sticky top-0 z-50`
- Settings sidebar: `sticky top-20 self-start`

### Routes
```typescript
/                     // Landing page
/app                  // Dashboard (today's puzzles)
/app/lists           // Word lists overview
/app/lists/:id       // Word list detail/edit
/app/puzzle/:id      // Puzzle solver
/app/stats           // Progress statistics
/settings            // User settings
/subscription        // Payment management
```

---

## 7. Development Setup

### Environment Variables
```bash
# .env.local (development)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Development Configuration

#### Email Setup (Development Only)
1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Email" provider → **Disable "Confirm email"** toggle
3. This allows signup without email verification for testing

⚠️ **BEFORE PRODUCTION**: 
- Re-enable email confirmation
- Configure proper SMTP provider
- Set up email templates

### Git Workflow
```bash
main          # Production (protected)
├── staging   # Pre-production testing  
└── dev       # Active development
    └── feature/* # Feature branches
```

---

## 8. Development Roadmap

### Phase 1: Foundation (Weeks 1-3)
**Week 1**: Setup & Architecture
- Project setup (Vite, React, TypeScript, Tailwind)
- Supabase project & schema
- Auth system with trial logic
- Base routing & layouts

**Week 2**: Data Management
- Word List & Word CRUD
- Import/Export (JSON)
- RLS policies
- React Query integration

**Week 3**: Core Algorithm
- Grid data structure
- Basic placement algorithm
- Connectivity validator
- Visual grid component

### Phase 2: Puzzle Generation (Weeks 4-6)
**Week 4**: Algorithm Refinement
- Word clustering
- Multi-start generation
- Performance optimization
- Edge case handling

**Week 5**: Puzzle UI
- Interactive grid
- Keyboard navigation
- Clue display
- Check/Submit/Hint

**Week 6**: Spaced Repetition
- SRS engine implementation
- Review type determination
- Progress tracking
- Daily review dashboard

### Phase 3: Polish (Weeks 7-8)
**Week 7**: UI/UX
- Responsive design
- Animations
- Error handling
- Loading states

**Week 8**: Features
- Statistics dashboard
- Progress visualization
- User settings
- Help/Tutorial

### Phase 4: Launch (Weeks 9-10)
**Week 9**: Payments
- Stripe integration
- Checkout flow
- Webhook handlers
- Subscription management

**Week 10**: Production
- Performance optimization
- Security audit
- Landing page
- Beta testing
- Deployment

---

## 9. Quality Metrics

### Performance KPIs
```yaml
Puzzle Generation:
  Time: <3 seconds for 15 words
  Success: 100% (split if needed)
  Connectivity: 100% connected

User Experience:
  FCP: <1.5s
  TTI: <3s
  Lighthouse: >90

Business:
  Trial→Paid: 15% target
  Monthly Churn: <10%
  Engagement: 5+ puzzles/week
```

### Testing Strategy
- **Unit Tests**: Algorithm logic, SRS calculations
- **Integration Tests**: API endpoints, database operations  
- **E2E Tests**: Complete user flows, payment process

---

## 10. Production Checklist

### Pre-Launch Requirements
- [ ] **Authentication**
  - [ ] Email confirmation ENABLED
  - [ ] Custom SMTP configured
  - [ ] Email templates customized
  
- [ ] **Security**
  - [ ] RLS policies on ALL tables
  - [ ] API rate limiting
  - [ ] Environment variables secured
  - [ ] CORS properly configured
  
- [ ] **Payments**
  - [ ] Live Stripe keys
  - [ ] Webhook endpoint verified
  - [ ] Subscription plans created
  
- [ ] **Performance**
  - [ ] Database indexes optimized
  - [ ] Edge functions warmed
  - [ ] CDN configured
  - [ ] Bundle size <200KB
  
- [ ] **Monitoring**
  - [ ] Sentry error tracking
  - [ ] Analytics (Plausible)
  - [ ] Uptime monitoring

---

## 11. Risk Mitigation

### Technical Risks
- **Slow generation**: Pre-generate overnight, cache results
- **Too many words**: Automatic batching into multiple puzzles
- **No crossings**: Fallback to flashcard mode for uncrossable words
- **DB overload**: Redis caching layer

### Business Risks  
- **Low conversion**: A/B test trial length (7/14/30 days)
- **High churn**: Engagement emails, achievement system
- **Competition**: Focus on UX quality, mobile app (Phase 5)

---

## 12. Key Decisions & Rationale

### Why Server-Side Generation?
- **Consistency**: Same puzzle for same words (cacheable)
- **Performance**: No UI blocking
- **Security**: Can't manipulate results client-side

### Why 7-Day Trial?
- **Urgency**: Creates decision pressure
- **Experience**: Enough to see value
- **Industry standard**: Common for EdTech

### Why Desktop-First?
- **Target audience**: Students studying at computers
- **Crossword UX**: Better with keyboard
- **Development speed**: Simpler than mobile-first

---

## Quick Reference

### Essential SQL Queries
```sql
-- Get today's due words
SELECT w.*, wp.repetition_level
FROM words w
JOIN word_progress wp ON w.id = wp.word_id
WHERE wp.user_id = $1
  AND wp.next_review_date <= CURRENT_DATE
ORDER BY wp.next_review_date;

-- Update progress after review
UPDATE word_progress
SET
  repetition_level = $2,
  next_review_date = CURRENT_DATE + INTERVAL '1 day' * $3,
  last_reviewed_at = NOW()
WHERE user_id = $1 AND word_id = $4;
```

### Debug Helpers
```typescript
// Console grid visualization
function debugGrid(grid: Grid) {
  console.log(grid.cells.map(row =>
    row.map(c => c.letter || '⬛').join(' ')
  ).join('\n'))
}

// Performance logging
console.time('puzzle-generation')
const puzzle = await generatePuzzle(words)
console.timeEnd('puzzle-generation')
```

---

**Domain**: xword.io (preferred) or edu-puzzle.com
**Support**: GitHub Issues → Wiki → Discord (post-launch)
**Developer**: David (ChromeOS/Crostini environment)

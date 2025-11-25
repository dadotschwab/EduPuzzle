# Specification: Daily Streak System

## 0. Original User Request

> please implement the daily streak system that is outlined in @.opencode/new_features/Daily_Streak_System.md . use the information provided by that file to improve the generation of the spec sheet.

## 1. Goal & Context

Implement a comprehensive "Streak System" to motivate users through continuity by tracking daily learning activity, providing "Streak Freezes" for missed days, and handling timezone-specific daily resets. The system will encourage consistent daily engagement with the learning platform through visual progress tracking and gamification elements.

**Key Requirements:**

- Track daily learning activity and maintain streak counters
- Implement streak freeze mechanism for missed days (monthly refill)
- Handle timezone-specific daily resets
- Visual dashboard integration with progress indicators
- Database-driven backend logic with triggers and cron jobs

**User Flow:**

1. User completes daily learning activities (5+ puzzles OR all due words)
2. System automatically detects completion and increments streak
3. Dashboard displays current streak, longest streak, and daily progress
4. If user misses a day, streak freeze is automatically consumed if available
5. Monthly reset refills streak freeze availability
6. Visual feedback through fire/ice icons and progress indicators

## 2. Requirements

### Functional:

- [ ] Track current streak and longest streak per user
- [ ] Record daily completion status with puzzles and words metrics
- [ ] Implement streak condition: 5+ puzzles OR all due words completed
- [ ] Handle timezone-specific daily resets at midnight
- [ ] Provide monthly streak freeze that auto-consumes on missed days
- [ ] Display streak information prominently on dashboard
- [ ] Show daily progress toward streak maintenance
- [ ] Auto-refill streak freezes on the 1st of each month

### Non-Functional:

- [ ] Database triggers for immediate streak updates
- [ ] Cron jobs for daily maintenance and monthly reset
- [ ] Timezone-aware date handling
- [ ] Efficient database queries with proper indexing
- [ ] Real-time UI updates without page refresh
- [ ] Graceful handling of edge cases (timezone changes, leap years)

## 3. Architecture & Research

### Codebase Impact

**Files to Modify:**

- `src/pages/Dashboard.tsx` (lines 113-121)
  - Current state: Header displays welcome message with user name
  - Required change: Add StreakDisplay component next to username in header

- `src/types/database.types.ts`
  - Current state: Contains existing table types (users, word_lists, etc.)
  - Required change: Add user_streaks and daily_completions table type definitions

**Files to Create:**

- `supabase/migrations/20251126000000_add_daily_streak_tables.sql`
  - Purpose: Create user_streaks and daily_completions tables with indexes and RLS policies
  - Pattern: Follow existing migration pattern (timestamped filename, SQL schema + indexes)

- `supabase/functions/daily-streak-maintenance/index.ts`
  - Purpose: Cron job for daily streak processing (00:05 UTC)
  - Pattern: Follow existing edge function pattern (CORS headers, auth validation, service client)

- `supabase/functions/monthly-streak-reset/index.ts`
  - Purpose: Cron job for monthly streak freeze refill (1st of month, 00:10 UTC)
  - Pattern: Follow existing edge function pattern (CORS headers, auth validation, service client)

- `src/hooks/useStreak.ts`
  - Purpose: React Query hook for streak data fetching and management
  - Pattern: Follow useSubscription.ts pattern (query key, enabled condition, error handling)

- `src/lib/api/streak.ts`
  - Purpose: API functions for streak operations (get streak data, record completion)
  - Pattern: Follow existing API pattern (supabase client, error handling, TypeScript types)

- `src/components/dashboard/StreakDisplay.tsx`
  - Purpose: React component for displaying streak information with fire/ice icons and progress
  - Pattern: Feature-based folder structure (follow dashboard/ pattern, use shadcn/ui components)

**Existing Patterns Identified:**

- **Database migrations:** Timestamped SQL files in `supabase/migrations/` with schema, indexes, and RLS policies
- **Supabase edge functions:** Deno-based functions in `supabase/functions/` with CORS, auth validation, and service client patterns
- **React hooks:** Custom hooks using React Query in `src/hooks/` with query keys, enabled conditions, and error classification
- **API functions:** Client-side API functions in `src/lib/api/` using Supabase client with error handling
- **React components:** Feature-based organization in `src/components/{feature}/` using shadcn/ui components
- **Type definitions:** Auto-generated database types in `src/types/database.types.ts` from Supabase CLI
- **Dashboard integration:** Components added to Dashboard.tsx header section with existing styling patterns

**Dependencies Status:**

- ✅ @supabase/supabase-js: ^2.38.0 (installed - for database operations)
- ✅ @tanstack/react-query: (installed - for data fetching in hooks)
- ✅ shadcn/ui components: (installed - for StreakDisplay UI)
- ⚠️ pg_cron: Extension needed for scheduled functions (verify in Supabase project settings)
- ❌ @supabase/pg_cron: Not installed (may need for cron job scheduling if not using edge functions)

## 4. Tech Stack Specifications

### Supabase (Backend)

**Schema Design:**

```sql
-- Migration: Add daily streak system tables
-- File: supabase/migrations/20251126000000_add_daily_streak_tables.sql

-- Table: user_streaks
-- Purpose: Store user streak data and freeze mechanics
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  streak_freezes_available INTEGER DEFAULT 1 NOT NULL CHECK (streak_freezes_available >= 0),
  last_streak_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Table: daily_completions
-- Purpose: Track daily learning activity for streak calculation
CREATE TABLE public.daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  puzzles_completed INTEGER DEFAULT 0 NOT NULL CHECK (puzzles_completed >= 0),
  words_completed INTEGER DEFAULT 0 NOT NULL CHECK (words_completed >= 0),
  due_words_count INTEGER DEFAULT 0 NOT NULL CHECK (due_words_count >= 0),
  streak_maintained BOOLEAN DEFAULT false,
  freeze_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, completion_date)
);

-- Indexes for performance
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_daily_completions_user_date ON public.daily_completions(user_id, completion_date DESC);
CREATE INDEX idx_daily_completions_date ON public.daily_completions(completion_date);
CREATE INDEX idx_daily_completions_streak_maintained ON public.daily_completions(streak_maintained) WHERE streak_maintained = true;

-- Comments for clarity
COMMENT ON TABLE public.user_streaks IS 'User streak counters and freeze mechanics for daily learning motivation';
COMMENT ON COLUMN public.user_streaks.current_streak IS 'Current consecutive days of streak maintenance';
COMMENT ON COLUMN public.user_streaks.longest_streak IS 'Personal best streak length';
COMMENT ON COLUMN public.user_streaks.streak_freezes_available IS 'Available streak freezes (refilled monthly)';
COMMENT ON TABLE public.daily_completions IS 'Daily learning activity tracking for streak calculation';
COMMENT ON COLUMN public.daily_completions.puzzles_completed IS 'Number of crossword puzzles completed today';
COMMENT ON COLUMN public.daily_completions.words_completed IS 'Number of vocabulary words reviewed today';
COMMENT ON COLUMN public.daily_completions.due_words_count IS 'Total due words at start of day';
COMMENT ON COLUMN public.daily_completions.streak_maintained IS 'Whether streak condition was met (5+ puzzles OR all due words)';
```

**RLS Policies:**

```sql
-- Enable RLS on both tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_completions ENABLE ROW LEVEL SECURITY;

-- User Streaks: Users can only read/write their own streak data
CREATE POLICY "users_read_own_streaks"
  ON public.user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_streaks"
  ON public.user_streaks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all streak data (for cron jobs and webhooks)
CREATE POLICY "service_role_manage_streaks"
  ON public.user_streaks
  FOR ALL
  USING (auth.role() = 'service_role');

-- Daily Completions: Users can only read/write their own completion data
CREATE POLICY "users_read_own_completions"
  ON public.daily_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_completions"
  ON public.daily_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_completions"
  ON public.daily_completions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all completion data (for cron jobs)
CREATE POLICY "service_role_manage_completions"
  ON public.daily_completions
  FOR ALL
  USING (auth.role() = 'service_role');
```

**Database Functions:**

```sql
-- Function: record_daily_completion
-- Purpose: Record daily learning activity and update streaks
-- Usage: Called when user completes puzzles or reviews words
CREATE OR REPLACE FUNCTION public.record_daily_completion(
  user_id_param UUID,
  puzzles_completed_param INTEGER DEFAULT 0,
  words_completed_param INTEGER DEFAULT 0,
  due_words_count_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  streak_maintained BOOLEAN,
  current_streak INTEGER,
  longest_streak INTEGER,
  freeze_used BOOLEAN
) AS $
DECLARE
  today_date DATE := CURRENT_DATE;
  existing_completion RECORD;
  streak_condition_met BOOLEAN;
  user_streak RECORD;
  freeze_used BOOLEAN := false;
BEGIN
  -- Check if completion already exists for today
  SELECT * INTO existing_completion
  FROM daily_completions
  WHERE user_id = user_id_param AND completion_date = today_date;

  -- Update or insert completion record
  IF existing_completion.id IS NOT NULL THEN
    -- Update existing record
    UPDATE daily_completions
    SET
      puzzles_completed = GREATEST(existing_completion.puzzles_completed, puzzles_completed_param),
      words_completed = GREATEST(existing_completion.words_completed, words_completed_param),
      due_words_count = GREATEST(existing_completion.due_words_count, due_words_count_param),
      updated_at = now()
    WHERE id = existing_completion.id;
  ELSE
    -- Insert new record
    INSERT INTO daily_completions (
      user_id, completion_date, puzzles_completed, words_completed, due_words_count
    ) VALUES (
      user_id_param, today_date, puzzles_completed_param, words_completed_param, due_words_count_param
    );
  END IF;

  -- Check streak condition: 5+ puzzles OR all due words completed
  SELECT (puzzles_completed >= 5 OR words_completed >= due_words_count) INTO streak_condition_met
  FROM daily_completions
  WHERE user_id = user_id_param AND completion_date = today_date;

  -- Get or create user streak record
  SELECT * INTO user_streak
  FROM user_streaks
  WHERE user_id = user_id_param;

  IF user_streak.id IS NULL THEN
    -- Create initial streak record
    INSERT INTO user_streaks (user_id) VALUES (user_id_param)
    RETURNING * INTO user_streak;
  END IF;

  -- Update streak based on condition
  IF streak_condition_met THEN
    -- Maintain/increase streak
    user_streak.current_streak := user_streak.current_streak + 1;
    user_streak.longest_streak := GREATEST(user_streak.longest_streak, user_streak.current_streak);
  ELSE
    -- Check if we can use a freeze
    IF user_streak.streak_freezes_available > 0 THEN
      user_streak.streak_freezes_available := user_streak.streak_freezes_available - 1;
      freeze_used := true;
      -- Keep current streak intact
    ELSE
      -- Reset streak
      user_streak.current_streak := 0;
    END IF;
  END IF;

  -- Update streak record
  UPDATE user_streaks
  SET
    current_streak = user_streak.current_streak,
    longest_streak = user_streak.longest_streak,
    streak_freezes_available = user_streak.streak_freezes_available,
    last_streak_update = now(),
    updated_at = now()
  WHERE id = user_streak.id;

  -- Update completion record with streak status
  UPDATE daily_completions
  SET
    streak_maintained = streak_condition_met,
    freeze_used = freeze_used,
    updated_at = now()
  WHERE user_id = user_id_param AND completion_date = today_date;

  -- Return updated values
  RETURN QUERY SELECT
    streak_condition_met,
    user_streak.current_streak,
    user_streak.longest_streak,
    freeze_used;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: refill_streak_freezes
-- Purpose: Monthly refill of streak freezes (called by cron job)
-- Usage: Run on 1st of each month at 00:10 UTC
CREATE OR REPLACE FUNCTION public.refill_streak_freezes()
RETURNS INTEGER AS $
DECLARE
  updated_count INTEGER;
BEGIN
  -- Refill streak freezes to 1 for all users
  UPDATE user_streaks
  SET
    streak_freezes_available = 1,
    updated_at = now()
  WHERE streak_freezes_available < 1;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: process_daily_streak_maintenance
-- Purpose: Daily maintenance to handle missed days (called by cron job)
-- Usage: Run daily at 00:05 UTC
CREATE OR REPLACE FUNCTION public.process_daily_streak_maintenance()
RETURNS INTEGER AS $
DECLARE
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  processed_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users who didn't complete yesterday and don't have a completion record
  FOR user_record IN
    SELECT DISTINCT us.user_id
    FROM user_streaks us
    LEFT JOIN daily_completions dc ON dc.user_id = us.user_id AND dc.completion_date = yesterday_date
    WHERE dc.id IS NULL
  LOOP
    -- Record missed day (will trigger freeze consumption via record_daily_completion)
    PERFORM record_daily_completion(user_record.user_id, 0, 0, 0);
    processed_count := processed_count + 1;
  END LOOP;

  RETURN processed_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.record_daily_completion(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refill_streak_freezes() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_daily_streak_maintenance() TO service_role;
```

**Database Triggers:**

```sql
-- Trigger: Auto-update updated_at on user_streaks
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_updated_at();

-- Trigger: Auto-update updated_at on daily_completions
CREATE OR REPLACE FUNCTION update_daily_completions_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_completions_updated_at
  BEFORE UPDATE ON public.daily_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_completions_updated_at();
```

**Realtime Configuration:**

```sql
-- Enable Realtime for user_streaks table
-- Purpose: Live streak updates on dashboard without page refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_streaks;

-- Note: Client filters to own user_id, RLS ensures security
-- Realtime events will trigger on streak changes for instant UI updates
```

**Migration Strategy:**

1. **Create migration file:**

   ```bash
   supabase migration new add_daily_streak_tables
   ```

2. **Add all SQL above to migration file** (schema, indexes, RLS policies, functions, triggers)

3. **Test locally:**

   ```bash
   supabase db reset  # Resets to clean state + runs migrations
   ```

4. **Verify RLS:**
   - Test: User A cannot see User B's streak data
   - Test: Anonymous users cannot access streak tables
   - Test: Service role can manage all data

5. **Test functions:**
   - Test: `record_daily_completion()` updates streaks correctly
   - Test: Streak freeze consumption works
   - Test: Monthly refill function works

6. **Deploy to production:**
   ```bash
   supabase db push
   ```

**Type Generation:**
After migration, regenerate TypeScript types:

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

**Best Practices from Docs:**

- [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)
  - Key insight: Indexes on columns used in RLS policies are critical
  - Applied: Added indexes on `user_id` columns for fast policy evaluation

- [Supabase Realtime Security](https://supabase.com/docs/guides/realtime/security)
  - Key insight: RLS policies apply to Realtime subscriptions
  - Applied: Client can only subscribe to their own `user_id` changes

- [PostgreSQL SECURITY DEFINER](https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker)
  - Key insight: Use sparingly, only when function needs to bypass RLS
  - Applied: Functions use DEFINER to manage cross-table operations and cron jobs

**Security Considerations:**

- ✅ User data isolation (RLS enforced per user)
- ✅ Service role access for maintenance operations
- ✅ No direct client writes to streak counters (function-mediated updates)
- ✅ Timezone-aware date handling with UTC storage
- ✅ Idempotent operations prevent duplicate processing
- ⚠️ Cron jobs run with service_role key (trusted environment only)

### Stripe (Payments)

[TODO: @stripe-specialist - Not applicable for this feature]

### React + Shadcn/UI (Frontend)

**Component Architecture:**

```
src/components/dashboard/
├── StreakDisplay.tsx       # Main streak display component
├── StreakProgress.tsx      # Progress indicator for daily goals
└── StreakBadge.tsx         # Reusable badge for streak status
```

**Component Specifications:**

---

**1. StreakDisplay.tsx**

Purpose: Main component displaying current streak, longest streak, and daily progress with fire/ice visual indicators.

Props:

```typescript
interface StreakDisplayProps {
  className?: string // Optional custom styling
}
```

State Management:

- Uses `useStreak` hook for data fetching
- Local state for animation triggers
- Realtime updates via Supabase subscription

Key Logic:

- Displays current streak with fire icon (🔥) for active streaks
- Shows longest streak as personal record
- Indicates streak freeze availability with ice icon (🧊)
- Progress bar for today's completion toward streak maintenance
- Handles loading states with skeleton placeholders
- Shows error states with retry options

Layout:

```tsx
<div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
  {/* Current Streak */}
  <div className="flex items-center gap-2">
    <div className="text-2xl">🔥</div>
    <div>
      <div className="text-sm text-gray-600">Current Streak</div>
      <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
    </div>
  </div>

  {/* Longest Streak */}
  <div className="flex items-center gap-2">
    <Trophy className="w-5 h-5 text-yellow-500" />
    <div>
      <div className="text-sm text-gray-600">Best Streak</div>
      <div className="text-lg font-semibold">{longestStreak}</div>
    </div>
  </div>

  {/* Freezes Available */}
  <div className="flex items-center gap-2">
    <div className="text-xl">🧊</div>
    <div>
      <div className="text-sm text-gray-600">Freezes</div>
      <div className="text-lg font-semibold">{freezesAvailable}</div>
    </div>
  </div>

  {/* Daily Progress */}
  <StreakProgress
    puzzlesCompleted={puzzlesCompleted}
    wordsCompleted={wordsCompleted}
    dueWords={dueWords}
    className="ml-auto"
  />
</div>
```

---

**2. StreakProgress.tsx**

Purpose: Visual progress indicator showing today's completion toward streak maintenance goals.

Props:

```typescript
interface StreakProgressProps {
  puzzlesCompleted: number
  wordsCompleted: number
  dueWords: number
  className?: string
}
```

Styling:

- Uses Shadcn `<Progress>` component for visual bar
- Color-coded: green when streak condition met, orange when in progress
- Shows completion metrics (puzzles + words reviewed)
- Tooltip with detailed breakdown

Accessibility:

- Screen reader announces progress percentage
- ARIA labels for progress indicators
- Keyboard accessible (focusable elements)

---

**3. StreakBadge.tsx**

Purpose: Reusable badge component for streak-related status indicators.

Props:

```typescript
interface StreakBadgeProps {
  variant: 'current' | 'best' | 'freeze' | 'completed' | 'at-risk'
  children: React.ReactNode
  className?: string
}
```

Styling:

- Uses Shadcn `<Badge>` with custom variants
- Color schemes: orange for active, blue for best, gray for freeze, green for completed
- Consistent with app design system

---

**Custom Hook: `useStreak.ts`**

Purpose: React Query hook for fetching and managing streak data with realtime updates.

Pattern: Follows `useSubscription.ts` pattern with query keys, enabled conditions, and error handling.

```typescript
// Hook signature
export function useStreak() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const query = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: getStreakData,
    enabled: !authLoading && isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Less aggressive than subscription
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof StreakApiError && error.statusCode === 401) {
        return false // Don't retry auth errors
      }
      return failureCount < 3
    },
  })

  // Realtime subscription for live updates
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return

    const channel = supabase
      .channel(`streak-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_streaks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          query.refetch() // Refetch on streak changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, isAuthenticated, query])

  // Mutation for recording completions
  const recordCompletionMutation = useMutation({
    mutationFn: recordDailyCompletion,
    onSuccess: () => {
      query.refetch() // Refresh streak data after completion
    },
  })

  return {
    ...query,
    recordCompletion: recordCompletionMutation.mutate,
    isRecording: recordCompletionMutation.isPending,
  }
}

// Helper functions
export function useStreakHelpers() {
  const { data } = useStreak()

  return {
    hasActiveStreak: (data?.currentStreak ?? 0) > 0,
    isStreakAtRisk: data?.currentStreak === 1, // Show warning for 1-day streaks
    canUseFreeze: (data?.streakFreezesAvailable ?? 0) > 0,
    streakConditionMet: (puzzles: number, words: number, dueWords: number) =>
      puzzles >= 5 || words >= dueWords,
  }
}
```

**Hook Dependencies:**

- `@supabase/supabase-js` for realtime subscriptions
- `@tanstack/react-query` for data fetching and caching
- `useAuth` from existing hooks (follows codebase pattern)

**Error Handling:**

- Returns `error` state for component display
- Custom `StreakApiError` class for typed errors
- Graceful degradation when realtime fails

---

**API Client Functions:**

Location: `src/lib/api/streak.ts`

```typescript
// Types from database schema
import { Database } from '@/types/database.types'

type UserStreak = Database['public']['Tables']['user_streaks']['Row']
type DailyCompletion = Database['public']['Tables']['daily_completions']['Row']

export interface StreakData {
  userStreak: UserStreak | null
  todaysCompletion: DailyCompletion | null
  yesterdayCompletion: DailyCompletion | null
}

export interface RecordCompletionRequest {
  puzzlesCompleted?: number
  wordsCompleted?: number
  dueWordsCount?: number
}

export interface RecordCompletionResponse {
  streakMaintained: boolean
  currentStreak: number
  longestStreak: number
  freezeUsed: boolean
}

// Custom error class
export class StreakApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'StreakApiError'
  }
}

// Get current streak data
export async function getStreakData(): Promise<StreakData> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    throw new StreakApiError('Not authenticated', 401)
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('user_streaks')
    .select(
      `
      *,
      todays_completion: daily_completions!inner(*),
      yesterday_completion: daily_completions(*)
    `
    )
    .eq('user_id', session.session.user.id)
    .eq('todays_completion.completion_date', today)
    .eq('yesterday_completion.completion_date', yesterday)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No streak record yet
      return { userStreak: null, todaysCompletion: null, yesterdayCompletion: null }
    }
    throw new StreakApiError(error.message, 500)
  }

  return {
    userStreak: data,
    todaysCompletion: data.todays_completion?.[0] || null,
    yesterdayCompletion: data.yesterday_completion?.[0] || null,
  }
}

// Record daily completion
export async function recordDailyCompletion(
  request: RecordCompletionRequest
): Promise<RecordCompletionResponse> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) {
    throw new StreakApiError('Not authenticated', 401)
  }

  const { data, error } = await supabase.rpc('record_daily_completion', {
    user_id_param: session.session.user.id,
    puzzles_completed_param: request.puzzlesCompleted || 0,
    words_completed_param: request.wordsCompleted || 0,
    due_words_count_param: request.dueWordsCount || 0,
  })

  if (error) {
    throw new StreakApiError(error.message, 500)
  }

  return data[0] // RPC returns array
}
```

**State Management Strategy:**

Based on codebase patterns:

- **Server state:** `useStreak` hook manages all streak data via React Query
- **Realtime updates:** Supabase Realtime keeps UI in sync without polling
- **Local state:** Minimal local state in components (animation triggers, loading states)
- **Optimistic updates:** For completion recording (show immediate feedback, rollback on error)

For this feature:

- ✅ Use `useStreak` hook for all data fetching
- ✅ Supabase Realtime for instant streak updates
- ✅ React Query mutations for completion recording
- ❌ No global Zustand store needed (streak data is user-specific)

---

**Shadcn/UI Components:**

**Install Required Components:**

```bash
npx shadcn-ui@latest add progress tooltip badge skeleton
```

**Component Usage:**

1. **Progress** (for daily completion tracking)
   - Docs: https://ui.shadcn.com/docs/components/progress
   - Usage: `<Progress value={progressPercentage} className="w-32" />`
   - Variants: `bg-green-500` when streak met, `bg-orange-500` when in progress

2. **Tooltip** (for detailed streak information)
   - Docs: https://ui.shadcn.com/docs/components/tooltip
   - Usage: `<TooltipProvider><Tooltip><TooltipTrigger>...</TooltipTrigger><TooltipContent>...</TooltipContent></Tooltip></TooltipProvider>`
   - Shows breakdown: "5+ puzzles OR all due words"

3. **Badge** (for status indicators)
   - Docs: https://ui.shadcn.com/docs/components/badge
   - Variants: `bg-orange-500` for active streak, `bg-blue-500` for best streak, `bg-gray-400` for freezes

4. **Skeleton** (loading states)
   - Docs: https://ui.shadcn.com/docs/components/skeleton
   - Usage: `<Skeleton className="h-8 w-24" />` for streak numbers during loading

**Layout Patterns (from Shadcn/Tailwind):**

```tsx
// Header integration in Dashboard.tsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-violet-900 to-slate-900 bg-clip-text text-transparent">
      Welcome back{user?.name ? `, ${user.name}` : ''}!
    </h1>
    <p className="text-slate-600 text-lg">
      Continue your vocabulary journey with crossword puzzles
    </p>
  </div>

  {/* Streak Display - positioned next to welcome text */}
  <StreakDisplay className="hidden md:block" />
</div>

{/* Mobile: Show streak below welcome text */}
<div className="md:hidden mb-4">
  <StreakDisplay />
</div>

// Progress component with conditional styling
<Progress
  value={progressPercentage}
  className={cn(
    "w-32 h-2",
    streakConditionMet ? "bg-green-100" : "bg-orange-100"
  )}
/>

// Badge variants for different states
<Badge variant={hasActiveStreak ? "default" : "secondary"}>
  {currentStreak} day{currentStreak !== 1 ? 's' : ''}
</Badge>
```

**Accessibility Considerations:**

- ✅ Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- ✅ Tooltips provide context for screen readers
- ✅ Color changes are supplemented with text/icons
- ✅ Loading skeletons prevent layout shift
- ✅ Error states include actionable retry buttons

**TypeScript Types:**

```typescript
// From Supabase schema (auto-generated after migration)
import { Database } from '@/types/database.types'

type UserStreak = Database['public']['Tables']['user_streaks']['Row']
type DailyCompletion = Database['public']['Tables']['daily_completions']['Row']

// Component-specific types
interface StreakDisplayData {
  currentStreak: number
  longestStreak: number
  streakFreezesAvailable: number
  todaysProgress: {
    puzzlesCompleted: number
    wordsCompleted: number
    dueWords: number
    progressPercentage: number
  }
}

// Hook return type
interface UseStreakReturn {
  data: StreakDisplayData | undefined
  isLoading: boolean
  error: Error | null
  recordCompletion: (params: RecordCompletionRequest) => void
  isRecording: boolean
}
```

**Integration with Backend:**

- Streak data fetched from `user_streaks` and `daily_completions` tables
- Realtime updates via Supabase subscriptions
- Completion recording via `record_daily_completion` RPC function
- Automatic streak maintenance handled by database functions and cron jobs

**Testing Considerations:**

Unit tests (Vitest):

- Test `useStreakHelpers` logic for streak conditions
- Test hook error states and retry behavior
- Test realtime subscription setup/cleanup

Component tests (React Testing Library):

- Test streak display with different streak values
- Test progress bar calculations and styling
- Test loading and error states

E2E tests (Playwright):

- Test full completion flow (puzzle solve → streak update)
- Test realtime updates across browser tabs
- Test streak freeze consumption on missed days

**Best Practices from Docs:**

- [React Query: Background Refetching](https://tanstack.com/query/latest/docs/react/guides/background-refetching)
  - Key insight: Use `refetchOnWindowFocus` strategically to avoid unnecessary requests
  - Applied: Disabled for streak data (less critical than subscription status)

- [Supabase Realtime: Client-side Filtering](https://supabase.com/docs/guides/realtime/postgres-changes#client-side-filtering)
  - Key insight: Filter subscriptions client-side for security
  - Applied: Filter to `user_id=eq.${user.id}` in subscription

- [Shadcn: Progress](https://ui.shadcn.com/docs/components/progress)
  - Key insight: Use semantic `value` prop for accessibility
  - Applied: Calculate percentage and pass to Progress component

**Common Pitfalls to Avoid:**

- ❌ Not cleaning up realtime subscriptions (memory leaks)
- ❌ Over-fetching streak data (use appropriate staleTime)
- ❌ Blocking UI during completion recording (use optimistic updates)
- ❌ Hardcoding streak conditions in components (centralize in helpers)
- ❌ Not handling timezone differences (use server-side date logic)
- ❌ Missing loading states (causes poor UX during data fetches)

## 5. Implementation Plan

### Phase 1: Database Foundation

- [ ] Create migration file `supabase/migrations/20251126000000_add_daily_streak_tables.sql`
- [ ] Add user_streaks table with proper constraints and indexes
- [ ] Add daily_completions table with unique constraints and indexes
- [ ] Implement RLS policies for both tables (user isolation + service role access)
- [ ] Create database functions: `record_daily_completion`, `refill_streak_freezes`, `process_daily_streak_maintenance`
- [ ] Add database triggers for auto-updating timestamps
- [ ] Enable Realtime on user_streaks table
- [ ] Test migration locally with `supabase db reset`

**Git Commit:** `feat(streak): add database schema for daily streak system`

---

### Phase 2: Supabase Edge Functions

- [ ] Create `supabase/functions/daily-streak-maintenance/index.ts` for daily cron job (00:05 UTC)
- [ ] Create `supabase/functions/monthly-streak-reset/index.ts` for monthly cron job (1st of month, 00:10 UTC)
- [ ] Implement proper CORS headers and error handling
- [ ] Add service role authentication and validation
- [ ] Test functions locally with Supabase CLI
- [ ] Deploy functions and set up cron schedules

**Git Commit:** `feat(streak): add cron jobs for streak maintenance`

---

### Phase 3: API Layer & Types

- [ ] Run database migration to generate new TypeScript types
- [ ] Create `src/lib/api/streak.ts` with API functions and error handling
- [ ] Implement `getStreakData()` function with proper joins
- [ ] Implement `recordDailyCompletion()` function using RPC
- [ ] Add custom `StreakApiError` class for typed errors
- [ ] Update `src/types/database.types.ts` with new table types

**Git Commit:** `feat(streak): add API layer for streak data management`

---

### Phase 4: React Hook Development

- [ ] Create `src/hooks/useStreak.ts` following existing patterns
- [ ] Implement React Query data fetching with proper cache settings
- [ ] Add Supabase Realtime subscription for live updates
- [ ] Implement `recordCompletion` mutation with optimistic updates
- [ ] Create `useStreakHelpers()` with utility functions
- [ ] Add proper error handling and retry logic
- [ ] Write unit tests for hook logic and helpers

**Git Commit:** `feat(streak): add useStreak hook with realtime updates`

---

### Phase 5: UI Components Development

- [ ] Install required Shadcn components: `progress`, `tooltip`, `badge`, `skeleton`
- [ ] Create `src/components/dashboard/StreakDisplay.tsx` with fire/ice icons
- [ ] Create `src/components/dashboard/StreakProgress.tsx` for daily progress
- [ ] Create `src/components/dashboard/StreakBadge.tsx` for status indicators
- [ ] Implement responsive design (desktop header, mobile below welcome)
- [ ] Add loading states with skeleton components
- [ ] Implement error states with retry functionality
- [ ] Add accessibility features (ARIA labels, screen reader support)

**Git Commit:** `feat(streak): add StreakDisplay component with progress indicators`

---

### Phase 6: Dashboard Integration

- [ ] Modify `src/pages/Dashboard.tsx` to include StreakDisplay in header
- [ ] Add responsive layout (hidden on mobile, shown below welcome text)
- [ ] Integrate with existing welcome message styling
- [ ] Test component integration and layout
- [ ] Verify responsive behavior across screen sizes

**Git Commit:** `feat(dashboard): integrate streak display in header`

---

### Phase 7: Completion Tracking Integration

- [ ] Update puzzle completion flow to call `recordDailyCompletion()`
- [ ] Update word review flow to call `recordDailyCompletion()`
- [ ] Ensure proper counting of puzzles completed and words reviewed
- [ ] Test streak increment after completing 5+ puzzles
- [ ] Test streak increment after completing all due words
- [ ] Verify freeze consumption on missed days

**Git Commit:** `feat(streak): integrate completion tracking with puzzle and word flows`

---

### Phase 8: Testing & Validation

**Automated Tests:**

- [ ] Unit test: `useStreakHelpers` streak condition logic
- [ ] Unit test: Hook error handling and retry behavior
- [ ] Component test: StreakDisplay with different streak values
- [ ] Component test: Progress bar calculations and styling
- [ ] Integration test: Full completion flow (puzzle → streak update)
- [ ] E2E test: Realtime updates across browser tabs
- [ ] E2E test: Streak freeze consumption on missed days

**Manual Validation:**

- [ ] Test streak creation and increment
- [ ] Test streak freeze monthly refill (1st of month)
- [ ] Test daily maintenance cron job (missed days)
- [ ] Test timezone handling for different user locations
- [ ] Test concurrent user streak updates
- [ ] Verify RLS policies prevent data access between users
- [ ] Test performance with large user datasets

**Git Commit:** `test(streak): add comprehensive tests and validate flows`

---

### Phase 9: Production Deployment

- [ ] Run full database migration on production
- [ ] Deploy edge functions and configure cron schedules
- [ ] Verify Realtime subscriptions work in production
- [ ] Monitor initial streak system performance
- [ ] Set up alerts for cron job failures
- [ ] Document streak system for users

**Git Commit:** `deploy(streak): production deployment and monitoring setup`

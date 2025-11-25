# Feature Specification: Daily Streak System

## Context
We are implementing a "Streak System" to motivate users through continuity. The system tracks daily learning activity, allows for "Streak Freezes," and handles timezones.

## Scope
This task encompasses the database schema, backend logic (cron/triggers), and frontend visualization on the Dashboard.

## 1. Database Requirements (Supabase/PostgreSQL)

**New Table: `user_streaks`**
Stores current streak status and freeze availability.
```sql
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_available BOOLEAN DEFAULT true, -- Refills monthly
  streak_freeze_used_at DATE,
  timezone TEXT DEFAULT 'Europe/Berlin',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
New Table: daily_completions Tracks daily progress to validate streak criteria.

SQL

CREATE TABLE daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  puzzles_completed INTEGER DEFAULT 0,
  words_due INTEGER DEFAULT 0,
  words_completed INTEGER DEFAULT 0,
  streak_maintained BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, completion_date)
);
CREATE INDEX idx_daily_completions_date ON daily_completions(user_id, completion_date);
2. Backend Logic
A. Streak Condition
A streak is maintained if:

puzzles_completed >= 5

OR words_completed >= words_due

Resets: Midnight in User Timezone.

B. Trigger Logic (Immediate)
Create a Database Trigger on daily_completions update:

Check if condition (5 puzzles OR words done) is met.

If met AND streak_maintained was false:

Set streak_maintained = true.

Increment user_streaks.current_streak.

Update longest_streak if current > longest.

C. Cron Jobs (Supabase Edge Function or pg_cron)
Daily Maintenance (00:05 UTC):

Check yesterday's status.

If streak_maintained is TRUE: Do nothing (streak safe).

If streak_maintained is FALSE:

Check streak_freeze_available.

If TRUE: Consume freeze (set available = false, log date), keep streak.

If FALSE: Reset current_streak to 0.

Monthly Reset (1st of month, 00:10 UTC):

Set streak_freeze_available = true for all users.

3. Frontend Requirements (React/TypeScript)
New Component: StreakDisplay

Props: currentStreak, longestStreak, freezeAvailable, todayProgress.

Visuals:

Fire Icon (🔥) + Count.

Ice Icon (❄️) indicating Freeze status (Active/Used).

Tooltip with details.

Progress Ring/Bar for daily goal (e.g., "3/5 puzzles").

Dashboard Integration

Place prominently in the "Welcome" header next to the username.

Data fetching should happen on dashboard load.
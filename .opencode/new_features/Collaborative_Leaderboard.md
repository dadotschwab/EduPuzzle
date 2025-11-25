# Feature Specification: Collaborative Leaderboard

## Context
A competitive element for shared word lists. Users collect points based on the SRS (Spaced Repetition System) stage of their words. Higher knowledge stage = more points.

## Scope
Database schema updates, Scoring Algorithm (PL/pgSQL Trigger), Caching strategy, and Frontend List View.

## 1. Database Requirements

**Update `list_collaborators` Table**
Add columns for caching scores to avoid expensive joins on every read.
```sql
ALTER TABLE list_collaborators ADD COLUMN leaderboard_opted_in BOOLEAN DEFAULT true;
ALTER TABLE list_collaborators ADD COLUMN cached_score INTEGER DEFAULT 0;
ALTER TABLE list_collaborators ADD COLUMN score_updated_at TIMESTAMPTZ;
2. Scoring Algorithm (The "Backend Brain")
Scoring Weights (Stage × Count)

Stage 0 (New/Forgot): 0 pts

Stage 1 (3 days): 1 pt

Stage 2 (7 days): 2 pts

Stage 3 (14 days): 4 pts

Stage 4 (30 days): 7 pts

Stage 5 (90 days): 12 pts

Stage 6 (Mastered): 20 pts

Trigger Logic (trg_update_leaderboard)

Event: AFTER INSERT OR UPDATE ON word_progress.

Action:

Identify the list_id and checks if it is a collaborative list (shared_lists).

Recalculate the SUM of scores for that user in that list using the weights above.

Update list_collaborators.cached_score.

3. Realtime & Caching Strategy
Write: Instant (via Trigger).

Read (Frontend):

Fetch list_collaborators ordered by cached_score DESC.

React Query Settings:

refetchInterval: 15 minutes (to keep it semi-live).

refetchOnWindowFocus: true.

staleTime: 5 minutes.

4. Frontend Requirements
Component: Leaderboard

Display a ranked list of users (Avatar, Name, Score, Progress Bar).

Highlight the "Current User".

Visuals: Top 3 get Medals (🥇, 🥈, 🥉).

Opt-out: Button "Stop participating" (Sets leaderboard_opted_in to false, hides user from list).

Empty State: If opted out, show "Join to compare with friends".
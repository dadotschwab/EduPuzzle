# Feature Specification: EduPuzzle Wrapped

## Context
A semi-annual "Year in Review" style feature (Spotify Wrapped) generated in February (for Aug-Jan) and July (for Feb-Jul). It generates shareable images.

## Scope
Database snapshotting, Slide generation logic, and Image Export.

## 1. Database Requirements

**Table: `user_wrapped`**
Stores the calculated stats so they are immutable once generated.
```sql
CREATE TABLE user_wrapped (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  period_start DATE,
  period_end DATE,
  active_days INTEGER,
  longest_streak INTEGER,
  words_mastered INTEGER,
  success_rate DECIMAL(5,2),
  percentile_active_days INTEGER, -- "Better than X% of users"
  share_token TEXT UNIQUE,
  UNIQUE(user_id, period_start)
);
2. Frontend Requirements (The Experience)
Component: WrappedOverlay

Fullscreen modal experience.

Slides:

Intro: "Your 6 months in summary".

Activity: Days active + percentile.

Streak: Longest streak + strongest month.

Knowledge: Words mastered (Stage 4+).

Share Card: A summary view designed for screenshotting.

Sharing Functionality (WrappedShare)

Library: Use html2canvas to render the DOM element of the Share Card to a PNG image.

Public Link: /wrapped/{share_token} (Public read-only page).

Actions: "Download Image", "Copy Link".

3. Data Generation Logic (Batch)
Note for backend: This data is not calculated live on view. It is calculated via a batch job (script) at the end of the semester and inserted into user_wrapped.

For this task, assume the data already exists in user_wrapped and focus on fetching and displaying it.
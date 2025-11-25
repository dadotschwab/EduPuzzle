# Feature Specification: Performance Insights

## Context
Advanced statistics for the user to reflect on their learning habits. Includes "Best Time to Learn", "Word Stage Distribution", and "Weakest Words".

## Scope
Database aggregation (Materialized View) and detailed Frontend Charts.

## 1. Database Requirements

**Materialized View: `mv_user_insights`**
To ensure dashboard performance, we aggregate data rather than querying raw logs live.
```sql
CREATE MATERIALIZED VIEW mv_user_insights AS
SELECT
  wp.user_id,
  COUNT(*) FILTER (WHERE stage = 0) as stage_0,
  COUNT(*) FILTER (WHERE stage = 1) as stage_1,
  -- ... repeat for stages 2-5 ...
  COUNT(*) FILTER (WHERE stage = 6) as stage_6,
  COUNT(*) as total_words
FROM word_progress wp
GROUP BY wp.user_id;
Refresh Strategy: Cron job daily.

Other Data Sources (Existing Tables)

word_reviews: Use EXTRACT(HOUR FROM reviewed_at) to calculate "Best Learning Time" (Hour with highest success rate).

word_reviews: Identify "Difficult Words" (Lowest success rate with min. 5 attempts).

2. Frontend Requirements
Widget 1: Compact Dashboard Card

Metrics: Total Learned, Global Success Rate (%), Weekly Puzzle count.

Trend indicators (e.g., "↑ +3%").

Widget 2: Detailed Stats Page (Settings/Stats)

Bucket Chart: Visual bar chart showing distribution of words across Stages 0-6.

Weekly Heatmap: A GitHub-style or simple bar chart showing activity (Mon-Sun).

Time Analysis: "Best time: 09:00 - 11:00 (87% correct)".

Weakest Words: List top 5 words with lowest accuracy.

3. Implementation Note
Use a charting library (e.g., Recharts or Chart.js) for the Bucket distribution.

Keep the dashboard widget lightweight (read from Materialized View). Calculate complex stats (Time Analysis) only on the detailed Settings page.
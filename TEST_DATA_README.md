# Test Data Insertion for EduPuzzle

This directory contains SQL scripts to insert test word lists into your Supabase database.

## What's Included

- **Easy Words List**: 267 common English words with high crossing potential
- **Medium Words List**: 293 words covering topics like technology, science, food, sports, etc.
- **Hard Words List**: 339 challenging words with rare letters (Q, X, Z, J, K, V, W)

## Prerequisites

1. You must have a user account with email `test345@test.de` in your Supabase auth.users table
2. The following tables must exist: `word_lists`, `words`

## How to Run

### Step 1: Create Test User (if needed)

If you don't have the test user yet, create it through Supabase Dashboard:
1. Go to Authentication → Users
2. Add new user with email: `test345@test.de`
3. Set a password
4. Note down the user ID (you'll see it in the table)

### Step 2: Run Part 1 (Creates lists + Easy/Medium words)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `insert_test_data.sql`
4. Paste and click "Run"

This will:
- Create 3 word lists: "Easy Words", "Medium Words", "Hard Words"
- Insert 267 Easy words
- Insert 293 Medium words

### Step 3: Run Part 2 (Adds Hard words)

1. Still in SQL Editor
2. Copy the contents of `insert_test_data_part2.sql`
3. Paste and click "Run"

This will:
- Insert 339 Hard words into the existing Hard list

## Verification

After running both scripts, you should see:

```sql
-- Check lists were created
SELECT * FROM word_lists WHERE name IN ('Easy Words', 'Medium Words', 'Hard Words');

-- Check word counts
SELECT
  wl.name,
  COUNT(w.id) as word_count
FROM word_lists wl
LEFT JOIN words w ON w.list_id = wl.id
WHERE wl.name IN ('Easy Words', 'Medium Words', 'Hard Words')
GROUP BY wl.name;
```

Expected results:
- Easy Words: 267 words
- Medium Words: 293 words
- Hard Words: 339 words
- **Total: 899 words**

## Testing Puzzle Generation

After inserting the data:

1. Log in as `test345@test.de`
2. Navigate to Dashboard (`/app`)
3. Click "Start Puzzle" on any of the three lists
4. The system will fetch 30 random words and generate a crossword puzzle

## Database Schema Reference

The scripts assume these table structures:

```sql
-- word_lists table
CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- words table
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Troubleshooting

**Error: "User with email test345@test.de not found"**
- Create the user first in Supabase Authentication

**Error: "Hard Words list not found"**
- Run `insert_test_data.sql` before `insert_test_data_part2.sql`

**Error: "permission denied for table words"**
- Make sure you're running the scripts as a superuser or the table owner
- Check your Row Level Security (RLS) policies

## Cleanup

To remove all test data:

```sql
-- Delete all words from test lists
DELETE FROM words
WHERE list_id IN (
  SELECT id FROM word_lists
  WHERE name IN ('Easy Words', 'Medium Words', 'Hard Words')
);

-- Delete the test lists
DELETE FROM word_lists
WHERE name IN ('Easy Words', 'Medium Words', 'Hard Words');
```

## Word Sources

These word lists are derived from:
- **Easy**: Common English words optimized for crossword generation
- **Medium**: Thematic vocabulary (technology, science, nature, food, sports, arts)
- **Hard**: Challenging words featuring rare letters for algorithm stress-testing

All words include translations/definitions suitable for educational use.

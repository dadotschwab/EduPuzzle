# Feature Specification: Buddy System (Accountability)

## Context
A 1:1 bidirectional relationship between two users ("Buddies"). It is a passive accountability system where users can see if their buddy has learned today. No chat features, just status.

## Scope
Database schema for relationships and invites, RPC functions for status fetching, and UI widgets.

## 1. Database Requirements

**New Table: `buddy_relationships`**
Ensures 1:1 mapping and prevents duplicates.
```sql
CREATE TABLE buddy_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a_id), -- User can only have 1 buddy
  UNIQUE(user_b_id),
  CHECK(user_a_id < user_b_id) -- Prevent (A,B) and (B,A) duplicates
);
New Table: buddy_invites

SQL

CREATE TABLE buddy_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS Policy: Users can only see their own invites.
2. Backend Logic (RPC Functions)
Function: get_buddy_status(user_id)

Returns: buddy_name, has_learned_today (Boolean), completion_percentage (Int).

Logic:

Find the buddy for the given user in buddy_relationships.

Join with daily_completions for CURRENT_DATE.

Calculate percentage based on words_completed / words_due.

3. Frontend Requirements
New Component: BuddyWidget

State A (No Buddy):

CTA: "Find a learning buddy".

Button: "Invite Buddy" (Generates Link).

State B (Has Buddy):

Shows Buddy Name.

Status: "Active Today ✅" or "Not started".

Progress Bar: 0-100% (Visual representation of their daily goal).

Action: "Remove Buddy" (Destructive).

Settings Integration

New Tab "Buddy".

Display current buddy info.

Button to copy Invite Link (valid 24h).

Button to disconnect.

4. Edge Cases
User tries to invite while already having a buddy (Error).

User accepts an expired link (Error).

User A removes User B (Link destroyed for both).
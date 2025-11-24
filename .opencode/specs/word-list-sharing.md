# Specification: Word List Sharing

## 0. Original User Request

> i want to implement a feature, where users can share their word lists. in the 3 dot menu, where users can choose to edit or delete their lists, i want them also to have a share button. if clicked a form/field should open up. i want it to look similar to google docs when sharing a document, where users see the link to share, and can decide between two options. the first option is to share the list as is, so the users who click the link can add the status quo of the list, and it becomes their own list. the second option is to make the list a collaborative list, where if one user enters a new word both all lists are updated. please make sure, that the srs applies only to the individual users, even if the list is cooperative.

## 1. Goal & Context

Implement a word list sharing system that allows users to either share static copies of their vocabulary lists or create collaborative lists that sync across multiple users. The feature should provide a Google Docs-like sharing interface with link-based access and two distinct sharing modes while maintaining individual SRS progress for each user.

**Key Requirements:**

- Add share button to existing 3-dot menu for word lists
- Create Google Docs-style sharing dialog with link generation
- Implement two sharing modes: static copy and collaborative
- Maintain individual SRS progress even for collaborative lists
- Real-time synchronization for collaborative lists

**User Flow:**

1. User clicks 3-dot menu on their word list
2. User selects "Share" option
3. Sharing dialog opens with generated shareable link
4. User chooses between "Share as copy" or "Share as collaborative"
5. User copies link and shares with others
6. Recipients click link to either import copy or join collaborative list
7. For collaborative lists, changes sync in real-time across all participants

## 2. Requirements

### Functional:

- [ ] Add share button to word list dropdown menu
- [ ] Create sharing dialog component with link display
- [ ] Generate unique shareable links for each word list
- [ ] Implement static copy sharing mode (one-time import)
- [ ] Implement collaborative sharing mode (real-time sync)
- [ ] Create link landing page for shared list access
- [ ] Handle list import for anonymous and authenticated users
- [ ] Real-time synchronization for collaborative lists
- [ ] Individual SRS progress tracking per user per word
- [ ] Share link management (view, disable, regenerate)

### Non-Functional:

- [ ] Real-time updates for collaborative lists (< 1 second latency)
- [ ] Secure access control for shared lists
- [ ] Scalable architecture supporting many concurrent collaborators
- [ ] Responsive design matching existing UI patterns
- [ ] Accessibility compliance for sharing interface
- [ ] Performance optimization for large word lists

## 3. Architecture & Research

### Codebase Impact

**Files to Modify:**

- `src/pages/Dashboard.tsx` (lines 146-167)
  - Current state: 3-dot dropdown menu with "Edit List" and "Delete List" options
  - Required change: Add "Share" option to dropdown menu, open ShareWordListDialog

- `src/hooks/useWordLists.ts` (new functions needed)
  - Current state: CRUD operations for word lists (create, read, update, delete)
  - Required change: Add share-related functions (generateShareLink, getSharedList, importSharedList)

- `src/lib/api/wordLists.ts` (new API functions needed)
  - Current state: Basic CRUD operations using Supabase
  - Required change: Add sharing API functions with proper RLS policies

- `src/types/database.ts` (new tables needed)
  - Current state: word_lists, words, word_progress tables
  - Required change: Add shared_lists and list_collaborators tables

- `src/types/index.ts` (new types needed)
  - Current state: WordList, WordListWithCount types
  - Required change: Add SharedList, ShareMode, Collaborator types

**Files to Create:**

- `src/components/words/ShareWordListDialog.tsx`
  - Purpose: Google Docs-style sharing dialog with link generation and mode selection
  - Pattern: Follow EditWordListDialog structure (Dialog + form components)

- `src/pages/SharedList.tsx`
  - Purpose: Landing page for shared list links (handle both copy import and collaborative join)
  - Pattern: Follow WordListDetail structure but with different permissions

- `src/hooks/useSharedLists.ts`
  - Purpose: Manage shared list state, collaborators, and real-time sync
  - Pattern: Follow useWordLists pattern with React Query + Supabase

- `src/hooks/useCollaborativeLists.ts`
  - Purpose: Handle real-time synchronization for collaborative lists
  - Pattern: Custom hook using Supabase Realtime subscriptions

- `src/lib/api/sharedLists.ts`
  - Purpose: API functions for sharing operations
  - Pattern: Follow wordLists.ts pattern with query/mutate wrappers

- `src/components/words/CollaborativeWordList.tsx`
  - Purpose: Enhanced word list component with real-time collaborator features
  - Pattern: Extend existing word list components with collaboration UI

- `src/components/words/ShareLinkDisplay.tsx`
  - Purpose: Component to display and copy shareable links
  - Pattern: Follow existing form input patterns

**Existing Patterns Identified:**

- **Word list management:** Cards with 3-dot menus in Dashboard, dialogs for edit/delete operations
- **Dropdown menus:** Custom dropdown-menu component mimicking Radix UI API, used for actions
- **Dialog patterns:** Dialog components with form inputs, following consistent structure (CreateWordListDialog, EditWordListDialog)
- **Database schema:** Supabase tables with user_id foreign keys, RLS policies for access control
- **Authentication:** useAuth hook with Supabase auth, user context throughout app
- **API patterns:** API functions in lib/api/ with React Query hooks in hooks/, consistent error handling
- **Real-time features:** Supabase auth real-time, but no data subscriptions yet (opportunity for collaborative sync)
- **Component structure:** Feature-based folders (words/, auth/, etc.), reusable UI components

**Dependencies Status:**

- ✅ @supabase/supabase-js: ^2.39.0 (installed - supports Realtime)
- ✅ @tanstack/react-query: ^5.20.0 (installed - for data fetching)
- ✅ React Router: ^6.22.0 (installed - for shared list routes)
- ⚠️ Supabase Realtime: Available but not yet used in codebase (need to implement subscriptions)
- ❌ UUID generation: May need uuid library for share tokens (check if crypto.randomUUID() sufficient)

## 4. Tech Stack Specifications

### Supabase (Backend)

**Schema Design:**

```sql
-- Table: shared_lists
-- Purpose: Tracks shared word lists with their access tokens and sharing modes
CREATE TABLE public.shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_list_id UUID NOT NULL REFERENCES public.word_lists(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  share_mode TEXT NOT NULL CHECK (share_mode IN ('copy', 'collaborative')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration for temporary shares
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ
);

-- Table: list_collaborators
-- Purpose: Tracks users who have joined collaborative shared lists
CREATE TABLE public.list_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_list_id UUID NOT NULL REFERENCES public.shared_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  UNIQUE(shared_list_id, user_id)
);

-- Add sharing fields to existing word_lists table
ALTER TABLE public.word_lists
ADD COLUMN is_shared BOOLEAN DEFAULT false,
ADD COLUMN shared_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX idx_shared_lists_token ON public.shared_lists(share_token) WHERE is_active = true;
CREATE INDEX idx_shared_lists_original ON public.shared_lists(original_list_id);
CREATE INDEX idx_list_collaborators_shared ON public.list_collaborators(shared_list_id);
CREATE INDEX idx_list_collaborators_user ON public.list_collaborators(user_id);
CREATE INDEX idx_word_lists_shared ON public.word_lists(is_shared) WHERE is_shared = true;

-- Comments for maintainability
COMMENT ON TABLE public.shared_lists IS 'Tracks shared word lists with access tokens and sharing modes';
COMMENT ON COLUMN public.shared_lists.share_mode IS 'copy: one-time import, collaborative: real-time sync';
COMMENT ON TABLE public.list_collaborators IS 'Users who have joined collaborative shared lists';
COMMENT ON COLUMN public.word_lists.is_shared IS 'Whether this list has been shared publicly';
```

**RLS Policies:**

```sql
-- Enable RLS on new tables
ALTER TABLE public.shared_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_collaborators ENABLE ROW LEVEL SECURITY;

-- Shared Lists Policies
-- Owners can manage their shared lists
CREATE POLICY "owners_manage_shared_lists"
  ON public.shared_lists
  FOR ALL
  USING (auth.uid() = created_by);

-- Anyone can view active shared lists (for token validation)
CREATE POLICY "anyone_view_active_shared_lists"
  ON public.shared_lists
  FOR SELECT
  USING (is_active = true);

-- List Collaborators Policies
-- Owners can manage collaborators on their lists
CREATE POLICY "owners_manage_collaborators"
  ON public.list_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_lists
      WHERE shared_lists.id = list_collaborators.shared_list_id
      AND shared_lists.created_by = auth.uid()
    )
  );

-- Collaborators can view their own memberships
CREATE POLICY "collaborators_view_own_membership"
  ON public.list_collaborators
  FOR SELECT
  USING (auth.uid() = user_id);

-- Words table: Extend existing policies for shared access
-- Existing policy: Users can view words in their lists
-- Add policy: Collaborators can view words in shared collaborative lists
CREATE POLICY "collaborators_view_shared_words"
  ON public.words
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.word_lists wl
      JOIN public.shared_lists sl ON sl.original_list_id = wl.id
      JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
      WHERE wl.id = words.list_id
      AND sl.share_mode = 'collaborative'
      AND sl.is_active = true
      AND lc.user_id = auth.uid()
    )
  );

-- Similar policies for INSERT, UPDATE, DELETE on words for collaborators
CREATE POLICY "collaborators_modify_shared_words"
  ON public.words
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.word_lists wl
      JOIN public.shared_lists sl ON sl.original_list_id = wl.id
      JOIN public.list_collaborators lc ON lc.shared_list_id = sl.id
      WHERE wl.id = words.list_id
      AND sl.share_mode = 'collaborative'
      AND sl.is_active = true
      AND lc.user_id = auth.uid()
      AND lc.role IN ('owner', 'member') -- All collaborators can modify
    )
  );
```

**Database Functions:**

```sql
-- Function: generate_share_token
-- Purpose: Generate a unique, secure share token for list sharing
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT AS $
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  -- Generate a URL-safe token (22 chars = 128 bits of entropy)
  LOOP
    token := encode(gen_random_bytes(16), 'base64url');
    -- Check uniqueness
    SELECT COUNT(*) INTO exists_count
    FROM public.shared_lists
    WHERE share_token = token;

    EXIT WHEN exists_count = 0;
  END LOOP;

  RETURN token;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: create_shared_list
-- Purpose: Create a new shared list entry with token generation
CREATE OR REPLACE FUNCTION public.create_shared_list(
  p_list_id UUID,
  p_share_mode TEXT
)
RETURNS UUID AS $
DECLARE
  v_shared_list_id UUID;
BEGIN
  -- Validate ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.word_lists
    WHERE id = p_list_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not the owner of this list';
  END IF;

  -- Create shared list entry
  INSERT INTO public.shared_lists (
    original_list_id,
    share_token,
    share_mode,
    created_by
  ) VALUES (
    p_list_id,
    generate_share_token(),
    p_share_mode,
    auth.uid()
  ) RETURNING id INTO v_shared_list_id;

  -- Mark original list as shared
  UPDATE public.word_lists
  SET is_shared = true, shared_at = now()
  WHERE id = p_list_id;

  -- If collaborative, add owner as collaborator
  IF p_share_mode = 'collaborative' THEN
    INSERT INTO public.list_collaborators (
      shared_list_id,
      user_id,
      role
    ) VALUES (
      v_shared_list_id,
      auth.uid(),
      'owner'
    );
  END IF;

  RETURN v_shared_list_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: import_shared_list_copy
-- Purpose: Import a shared list as a personal copy
CREATE OR REPLACE FUNCTION public.import_shared_list_copy(
  p_share_token TEXT
)
RETURNS UUID AS $
DECLARE
  v_original_list_id UUID;
  v_new_list_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Validate token and get original list
  SELECT original_list_id INTO v_original_list_id
  FROM public.shared_lists
  WHERE share_token = p_share_token
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());

  IF v_original_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired share token';
  END IF;

  -- Create new list copy
  INSERT INTO public.word_lists (
    user_id,
    name,
    source_language,
    target_language
  )
  SELECT
    v_user_id,
    name || ' (Shared Copy)',
    source_language,
    target_language
  FROM public.word_lists
  WHERE id = v_original_list_id
  RETURNING id INTO v_new_list_id;

  -- Copy all words
  INSERT INTO public.words (
    list_id,
    term,
    translation,
    definition,
    example_sentence
  )
  SELECT
    v_new_list_id,
    term,
    translation,
    definition,
    example_sentence
  FROM public.words
  WHERE list_id = v_original_list_id;

  -- Copy word progress for the importing user
  INSERT INTO public.word_progress (
    user_id,
    word_id,
    stage,
    ease_factor,
    interval_days,
    next_review_date
  )
  SELECT
    v_user_id,
    w.id,
    0, 2.5, 0, CURRENT_DATE
  FROM public.words w
  WHERE w.list_id = v_new_list_id;

  -- Update access count
  UPDATE public.shared_lists
  SET access_count = access_count + 1,
      last_accessed_at = now()
  WHERE share_token = p_share_token;

  RETURN v_new_list_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: join_collaborative_list
-- Purpose: Join a collaborative shared list
CREATE OR REPLACE FUNCTION public.join_collaborative_list(
  p_share_token TEXT
)
RETURNS UUID AS $
DECLARE
  v_shared_list_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get shared list ID and validate
  SELECT id INTO v_shared_list_id
  FROM public.shared_lists
  WHERE share_token = p_share_token
  AND share_mode = 'collaborative'
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());

  IF v_shared_list_id IS NULL THEN
    RAISE EXCEPTION 'Invalid collaborative share token';
  END IF;

  -- Check if already a collaborator
  IF EXISTS (
    SELECT 1 FROM public.list_collaborators
    WHERE shared_list_id = v_shared_list_id
    AND user_id = v_user_id
  ) THEN
    RETURN v_shared_list_id;
  END IF;

  -- Add as collaborator
  INSERT INTO public.list_collaborators (
    shared_list_id,
    user_id,
    role
  ) VALUES (
    v_shared_list_id,
    v_user_id,
    'member'
  );

  -- Update access count
  UPDATE public.shared_lists
  SET access_count = access_count + 1,
      last_accessed_at = now()
  WHERE id = v_shared_list_id;

  RETURN v_shared_list_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_shared_list(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_shared_list_copy(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_collaborative_list(TEXT) TO authenticated;
```

**Realtime Configuration:**

```sql
-- Enable Realtime for collaborative word lists
-- Purpose: Real-time synchronization when collaborators modify shared words
ALTER PUBLICATION supabase_realtime ADD TABLE public.words;

-- Note: Client-side filtering required - only subscribe to words.list_id
-- that the user has collaborative access to, to avoid unnecessary broadcasts

-- Optional: Enable Realtime for list_collaborators to show online collaborators
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_collaborators;
```

**Migration Strategy:**

1. **Create migration:**

   ```bash
   supabase migration new add_word_list_sharing
   ```

2. **Add SQL to migration file** (all CREATE and ALTER statements above)

3. **Test locally:**

   ```bash
   supabase db reset  # Apply migrations
   ```

4. **Verify RLS:**
   - Test: User A shares list, User B can access with token
   - Test: User B cannot access User A's private lists
   - Test: Collaborative changes sync between users
   - Test: SRS progress remains individual per user

5. **Deploy to production:**
   ```bash
   supabase db push
   ```

**Type Generation:**
After migration, regenerate TypeScript types:

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

**Best Practices from Docs:**

- [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)
  - Key insight: Add indexes on columns used in RLS policies
  - Applied: Indexes on share_token, user_id, shared_list_id

- [Supabase Realtime Security](https://supabase.com/docs/guides/realtime/security)
  - Key insight: RLS policies apply to Realtime subscriptions
  - Applied: Words table has RLS policies that restrict collaborative access

- [Database Functions Security](https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker)
  - Key insight: Use SECURITY DEFINER carefully, only when needed
  - Applied: Functions use DEFINER to bypass RLS for controlled operations

**Security Considerations:**

- ✅ Share tokens are cryptographically secure (16 bytes entropy)
- ✅ Token uniqueness enforced with loop-based generation
- ✅ RLS prevents unauthorized access to shared content
- ✅ Collaborative access restricted to explicit collaborators
- ✅ SRS progress isolation maintained (separate word_progress entries)
- ✅ Optional token expiration for temporary shares
- ⚠️ Real-time subscriptions require client-side filtering to avoid over-broadcasting

### Stripe (Payments)

[TODO: @stripe-specialist - Not applicable for this feature]

### React + Shadcn/UI (Frontend)

**Component Architecture:**

```
src/components/words/
├── ShareWordListDialog.tsx       # Google Docs-style sharing dialog
├── ShareLinkDisplay.tsx          # Component for displaying/copying share links
├── CollaborativeWordList.tsx     # Enhanced word list with real-time features
└── CollaboratorPresence.tsx      # Shows online collaborators

src/pages/
├── SharedList.tsx                # Landing page for shared list links
└── WordListDetail.tsx            # Enhanced with collaborative features

src/hooks/
├── useSharedLists.ts             # Manage shared list operations
├── useCollaborativeLists.ts      # Handle real-time collaborative sync
└── useShareLink.ts               # Generate and manage share links
```

**Component Specifications:**

---

**1. ShareWordListDialog.tsx**

Purpose: Google Docs-style sharing dialog with link generation and mode selection

Props:

```typescript
interface ShareWordListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wordList: WordList
}
```

State Management:

- Local state for selected share mode (copy/collaborative)
- Generated share link from useShareLink hook
- Loading states during link generation

Key Logic:

- Generate share link on dialog open
- Handle mode selection (copy vs collaborative)
- Copy link to clipboard functionality
- Error handling for link generation failures

Layout:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Share "{wordList.name}"</DialogTitle>
      <DialogDescription>Choose how you want to share this word list</DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* Share mode selection */}
      <div className="space-y-2">
        <Label>Sharing Options</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="copy"
              name="shareMode"
              value="copy"
              checked={shareMode === 'copy'}
              onChange={(e) => setShareMode(e.target.value as ShareMode)}
            />
            <Label htmlFor="copy" className="text-sm">
              <strong>Share as copy</strong>
              <p className="text-muted-foreground">Recipients get their own copy of the list</p>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="collaborative"
              name="shareMode"
              value="collaborative"
              checked={shareMode === 'collaborative'}
              onChange={(e) => setShareMode(e.target.value as ShareMode)}
            />
            <Label htmlFor="collaborative" className="text-sm">
              <strong>Share as collaborative</strong>
              <p className="text-muted-foreground">Everyone can edit the same list in real-time</p>
            </Label>
          </div>
        </div>
      </div>

      {/* Generated share link */}
      {shareLink && (
        <ShareLinkDisplay
          link={shareLink}
          shareMode={shareMode}
          onCopy={() => toast.success('Link copied to clipboard')}
        />
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

**2. ShareLinkDisplay.tsx**

Purpose: Display and copy shareable links with mode-specific messaging

Props:

```typescript
interface ShareLinkDisplayProps {
  link: string
  shareMode: 'copy' | 'collaborative'
  onCopy: () => void
}
```

Styling:

- Uses Shadcn Input component for link display
- Copy button with clipboard icon
- Success toast on copy
- Responsive design for mobile

Accessibility:

- Button has aria-label for screen readers
- Link input is readonly (not editable)
- Focus management for keyboard navigation

---

**3. SharedList.tsx (Landing Page)**

Purpose: Handle shared list links - either import copy or join collaborative list

Route: `/shared/:token`

State Management:

- Parse share token from URL
- Fetch shared list metadata
- Handle authentication requirements
- Show appropriate UI based on share mode and user auth status

Key Logic:

- Validate share token on page load
- For authenticated users: Import copy or join collaborative
- For anonymous users: Show login prompt for collaborative, allow copy import
- Redirect to word list detail after successful import/join

Layout:

```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <Card className="w-full max-w-md">
    <CardHeader>
      <CardTitle>Shared Word List</CardTitle>
      <CardDescription>
        {shareMode === 'copy'
          ? 'Import this word list to your account'
          : 'Join this collaborative word list'}
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold">{listName}</h3>
        <p className="text-sm text-muted-foreground">
          {wordCount} words • {sourceLanguage} → {targetLanguage}
        </p>
      </div>

      {user ? (
        <Button onClick={handleImportOrJoin} disabled={loading}>
          {loading ? 'Processing...' : shareMode === 'copy' ? 'Import List' : 'Join List'}
        </Button>
      ) : (
        <div className="space-y-2">
          <Button onClick={() => navigate('/login')} variant="outline">
            Sign in to {shareMode === 'copy' ? 'import' : 'join'}
          </Button>
          {shareMode === 'copy' && (
            <Button onClick={handleAnonymousImport} variant="ghost">
              Continue as guest
            </Button>
          )}
        </div>
      )}
    </CardContent>
  </Card>
</div>
```

---

**4. CollaborativeWordList.tsx**

Purpose: Enhanced word list component with real-time collaborative features

Props:

```typescript
interface CollaborativeWordListProps {
  wordList: WordList
  isOwner: boolean
  collaborators: Collaborator[]
}
```

State Management:

- Uses useCollaborativeLists hook for real-time sync
- Local state for optimistic updates
- Conflict resolution for simultaneous edits

Key Features:

- Real-time word additions/updates/deletions
- Collaborator presence indicators
- Optimistic UI updates with rollback on conflicts
- Owner controls (disable sharing, manage collaborators)

Layout:

```tsx
<div className="space-y-6">
  {/* Header with collaborators */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold">{wordList.name}</h2>
      <CollaboratorPresence collaborators={onlineCollaborators} />
    </div>

    {isOwner && (
      <Button variant="outline" size="sm">
        Manage Sharing
      </Button>
    )}
  </div>

  {/* Word list with real-time updates */}
  <div className="space-y-2">
    {words.map((word) => (
      <WordItem
        key={word.id}
        word={word}
        onEdit={handleWordEdit}
        onDelete={handleWordDelete}
        isCollaborative={true}
        lastEditedBy={word.lastEditedBy}
      />
    ))}
  </div>

  {/* Add word form */}
  <AddWordForm onAdd={handleAddWord} />
</div>
```

---

**Custom Hook: useSharedLists.ts**

Purpose: Manage shared list operations (create, fetch, import)

Pattern: Follows useWordLists pattern with React Query

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ShareMode, SharedList } from '@/types'

export function useCreateShareLink() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ listId, shareMode }: { listId: string; shareMode: ShareMode }) => {
      const { data, error } = await supabase.rpc('create_shared_list', {
        p_list_id: listId,
        p_share_mode: shareMode,
      })

      if (error) throw error
      return data as { share_token: string }
    },
    onSuccess: () => {
      // Invalidate word lists to show shared status
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}

export function useSharedList(token: string) {
  return useQuery({
    queryKey: ['sharedList', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_lists')
        .select(
          `
          *,
          original_list:word_lists(
            id, name, source_language, target_language,
            words(count)
          )
        `
        )
        .eq('share_token', token)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data as SharedList
    },
    enabled: !!token,
  })
}

export function useImportSharedList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ token, mode }: { token: string; mode: ShareMode }) => {
      const rpcFunction = mode === 'copy' ? 'import_shared_list_copy' : 'join_collaborative_list'

      const { data, error } = await supabase.rpc(rpcFunction, {
        p_share_token: token,
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wordLists'] })
    },
  })
}
```

**Hook Dependencies:**

- `@supabase/supabase-js` for database operations
- `@tanstack/react-query` for caching and mutations
- `useAuth` for user context

**Error Handling:**

- Network errors from Supabase
- Validation errors (invalid tokens, expired links)
- Permission errors (trying to share unowned lists)

---

**Custom Hook: useCollaborativeLists.ts**

Purpose: Handle real-time synchronization for collaborative lists

Pattern: Custom hook using Supabase Realtime subscriptions

```typescript
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Word } from '@/types'

export function useCollaborativeLists(listId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user || !listId) return

    // Subscribe to word changes in this collaborative list
    const channel = supabase
      .channel(`collaborative-list-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'words',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          // Invalidate and refetch words for this list
          queryClient.invalidateQueries({
            queryKey: ['words', listId],
          })

          // Handle different change types
          if (payload.eventType === 'INSERT') {
            // Show notification for new word added
            toast.success(`New word added by collaborator`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, listId, queryClient])

  // Helper function to add word with optimistic updates
  const addWord = useCallback(
    async (wordData: Omit<Word, 'id'>) => {
      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const optimisticWord = { ...wordData, id: tempId }

      queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
        return old ? [...old, optimisticWord] : [optimisticWord]
      })

      try {
        const { data, error } = await supabase.from('words').insert(wordData).select().single()

        if (error) throw error

        // Replace optimistic update with real data
        queryClient.setQueryData(['words', listId], (old: Word[] | undefined) => {
          return old?.map((word) => (word.id === tempId ? data : word))
        })
      } catch (error) {
        // Rollback optimistic update
        queryClient.invalidateQueries({ queryKey: ['words', listId] })
        throw error
      }
    },
    [listId, queryClient]
  )

  return { addWord }
}
```

**Real-time Features:**

- Supabase Realtime subscriptions for live updates
- Optimistic UI updates with rollback on errors
- Conflict resolution through server-side validation
- Presence tracking for online collaborators

**Performance Optimizations:**

- Client-side filtering to avoid unnecessary broadcasts
- Debounced updates for rapid changes
- Connection pooling for multiple collaborative lists

---

**API Client Functions:**

Location: `src/lib/api/sharedLists.ts`

```typescript
// Generate share link
export async function createShareLink(listId: string, shareMode: ShareMode) {
  const { data, error } = await supabase.rpc('create_shared_list', {
    p_list_id: listId,
    p_share_mode: shareMode,
  })

  if (error) throw error
  return data
}

// Get shared list by token
export async function getSharedList(token: string) {
  const { data, error } = await supabase
    .from('shared_lists')
    .select(
      `
      *,
      original_list:word_lists(
        id, name, source_language, target_language,
        words(count)
      )
    `
    )
    .eq('share_token', token)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data
}

// Import shared list copy
export async function importSharedListCopy(token: string) {
  const { data, error } = await supabase.rpc('import_shared_list_copy', {
    p_share_token: token,
  })

  if (error) throw error
  return data
}

// Join collaborative list
export async function joinCollaborativeList(token: string) {
  const { data, error } = await supabase.rpc('join_collaborative_list', {
    p_share_token: token,
  })

  if (error) throw error
  return data
}
```

---

**Shadcn/UI Components:**

**Existing Components Used:**

- ✅ **Dialog** - For sharing dialog and confirmations
  - Docs: https://ui.shadcn.com/docs/components/dialog
  - Usage: `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>`, `<DialogFooter>`

- ✅ **Button** - For actions (share, copy, import)
  - Variants: `default`, `outline`, `ghost`
  - States: `disabled` during loading

- ✅ **Input** - For displaying share links
  - Readonly for security
  - Full width with copy button

- ✅ **Card** - For shared list landing page
  - Docs: https://ui.shadcn.com/docs/components/card
  - Usage: `<Card>`, `<CardHeader>`, `<CardContent>`

- ✅ **Badge** - For collaborator status indicators
  - Docs: https://ui.shadcn.com/docs/components/badge
  - Variants: `default` (online), `secondary` (offline)

- ✅ **Alert Dialog** - For confirmation dialogs
  - Docs: https://ui.shadcn.com/docs/components/alert-dialog
  - Usage: Confirm leaving collaborative list

**Install Required Components:**

```bash
npx shadcn-ui@latest add dialog alert-dialog card badge input
```

**Component Usage Patterns:**

1. **Dialog** (ShareWordListDialog)
   - Controlled open/close state
   - Form validation before submission
   - Loading states with disabled buttons

2. **Input + Button** (ShareLinkDisplay)

   ```tsx
   <div className="flex space-x-2">
     <Input value={link} readOnly className="flex-1" />
     <Button size="sm" onClick={handleCopy}>
       <Copy className="h-4 w-4" />
     </Button>
   </div>
   ```

3. **Card** (SharedList landing page)
   - Clean, centered layout
   - Clear call-to-action buttons
   - Responsive design

4. **Badge** (Collaborator presence)
   ```tsx
   <div className="flex items-center space-x-1">
     <Badge variant={isOnline ? 'default' : 'secondary'}>{collaborator.name}</Badge>
     {isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
   </div>
   ```

---

**State Management Strategy:**

Based on codebase patterns (Section 3.1):

- **Server state:** React Query for shared list data and API operations
- **Real-time state:** Supabase Realtime subscriptions for collaborative updates
- **Local state:** React state for UI interactions (dialog open/close, form inputs)
- **Global state:** None needed (feature is user-specific, not global)

For this feature:

- ✅ Use React Query for all CRUD operations (create share, import list, etc.)
- ✅ Supabase Realtime for collaborative list synchronization
- ✅ Local state for UI-only concerns (selected share mode, dialog states)
- ❌ No Zustand store needed (data is user-specific and temporary)

---

**Real-time Features:**

**Supabase Realtime Integration:**

```typescript
// Subscribe to collaborative list changes
const channel = supabase
  .channel(`collaborative-${listId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'words',
      filter: `list_id=eq.${listId}`,
    },
    (payload) => {
      // Handle real-time updates
      queryClient.invalidateQueries(['words', listId])
    }
  )
  .subscribe()
```

**Presence Tracking:**

- Track online collaborators using Supabase Realtime presence
- Show "X collaborators online" indicator
- Update in real-time as users join/leave

**Conflict Resolution:**

- Server-side validation prevents conflicts
- Optimistic updates with rollback on failure
- Last-write-wins for simultaneous edits
- User notifications for conflicts

**Performance Considerations:**

- Client-side filtering to reduce broadcast overhead
- Debounced updates for rapid typing
- Connection limits for large collaborative lists

---

**TypeScript Types:**

```typescript
// From Supabase schema (Section 4.1)
import { Database } from '@/types/database.types'
type SharedList = Database['public']['Tables']['shared_lists']['Row']
type ListCollaborator = Database['public']['Tables']['list_collaborators']['Row']

// Component-specific types
export type ShareMode = 'copy' | 'collaborative'

export interface SharedListWithDetails extends SharedList {
  original_list: {
    id: string
    name: string
    source_language: string
    target_language: string
    wordCount: number
  }
}

export interface Collaborator extends ListCollaborator {
  user: {
    id: string
    email: string
    full_name?: string
  }
  isOnline: boolean
}

// Hook return types
export interface UseSharedListsReturn {
  createShareLink: UseMutationResult<
    { share_token: string },
    Error,
    { listId: string; shareMode: ShareMode }
  >
  importSharedList: UseMutationResult<any, Error, { token: string; mode: ShareMode }>
}

export interface UseCollaborativeListsReturn {
  addWord: (word: Omit<Word, 'id'>) => Promise<void>
  onlineCollaborators: Collaborator[]
}
```

---

**Integration with Backend (Section 4.2):**

- Share link creation: Call `create_shared_list` RPC function
- List import: Call `import_shared_list_copy` or `join_collaborative_list` RPC
- Real-time sync: Supabase Realtime subscriptions on words table
- Access control: RLS policies handle permissions automatically

---

**Testing Considerations:**

Unit tests (Vitest):

- Test share link generation and validation
- Test import/join mutations with mock data
- Test hook state updates on Realtime events

Component tests (React Testing Library):

- Test ShareWordListDialog mode selection
- Test ShareLinkDisplay copy functionality
- Test SharedList landing page flows
- Test CollaborativeWordList real-time updates

E2E tests (Playwright):

- Test full sharing flow (create → share → import)
- Test collaborative editing between users
- Test real-time synchronization
- Test error states (expired links, permissions)

---

**Best Practices from Docs:**

- [React Query: Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
  - Key insight: Update UI immediately, rollback on error
  - Applied: Optimistic word additions in collaborative lists

- [Supabase Realtime: Client-side Filtering](https://supabase.com/docs/guides/realtime#client-side-filtering)
  - Key insight: Filter subscriptions to reduce server load
  - Applied: Only subscribe to words in current collaborative list

- [Shadcn: Dialog Composition](https://ui.shadcn.com/docs/components/dialog#composition)
  - Key insight: Compose Dialog subcomponents for flexibility
  - Applied: Use DialogHeader, DialogContent, DialogFooter separately

**Common Pitfalls to Avoid:**

- ❌ Not cleaning up Realtime subscriptions (memory leaks)
- ❌ Trusting client-side state for access control (server validates)
- ❌ Hardcoding share URLs (use environment variables)
- ❌ Not handling offline scenarios (graceful degradation)
- ❌ Forgetting to invalidate React Query cache after mutations
- ❌ Not showing loading states during async operations
- ❌ Missing error boundaries for real-time failures

## 5. Implementation Plan

### Phase 1: Database Schema & Backend Foundation

- [ ] Create migration file: `supabase migration new add_word_list_sharing`
- [ ] Add shared_lists table with secure token generation
- [ ] Add list_collaborators table for collaborative access
- [ ] Extend word_lists table with sharing flags
- [ ] Create database indexes for performance
- [ ] Implement RLS policies for secure access control
- [ ] Create database functions (create_shared_list, import_shared_list_copy, join_collaborative_list)
- [ ] Enable Realtime on words and list_collaborators tables
- [ ] Test migration locally: `supabase db reset`
- [ ] Regenerate TypeScript types: `supabase gen types typescript --local > src/types/database.types.ts`

**Git Commit:** `feat(sharing): add database schema for word list sharing`

---

### Phase 2: API Layer & Type Definitions

- [ ] Create `src/lib/api/sharedLists.ts` with API functions
- [ ] Add sharing types to `src/types/index.ts` (ShareMode, SharedList, Collaborator)
- [ ] Update database types from migration
- [ ] Create `src/hooks/useSharedLists.ts` with React Query hooks
- [ ] Create `src/hooks/useShareLink.ts` for link generation
- [ ] Test API functions with mock data
- [ ] Verify RLS policies work correctly

**Git Commit:** `feat(sharing): add API layer and type definitions`

---

### Phase 3: Core UI Components

- [ ] Install required Shadcn components: `npx shadcn-ui@latest add dialog alert-dialog card badge input`
- [ ] Create `src/components/words/ShareWordListDialog.tsx` (Google Docs-style)
- [ ] Create `src/components/words/ShareLinkDisplay.tsx` (link display and copy)
- [ ] Create `src/components/words/CollaboratorPresence.tsx` (online indicators)
- [ ] Add share button to existing 3-dot menu in `src/pages/Dashboard.tsx`
- [ ] Test dialog opening/closing and mode selection
- [ ] Test link generation and copy functionality

**Git Commit:** `feat(sharing): add core sharing UI components`

---

### Phase 4: Shared List Landing Page

- [ ] Create `src/pages/SharedList.tsx` landing page component
- [ ] Add route `/shared/:token` to router configuration
- [ ] Implement token validation and list metadata display
- [ ] Handle authentication requirements for different share modes
- [ ] Add anonymous import flow for copy mode
- [ ] Add login prompt for collaborative mode
- [ ] Test landing page with valid/invalid tokens
- [ ] Test both authenticated and anonymous user flows

**Git Commit:** `feat(sharing): add shared list landing page`

---

### Phase 5: Real-time Collaboration

- [ ] Create `src/hooks/useCollaborativeLists.ts` with Realtime subscriptions
- [ ] Create `src/components/words/CollaborativeWordList.tsx` with real-time features
- [ ] Implement optimistic updates with rollback on errors
- [ ] Add collaborator presence tracking
- [ ] Add conflict resolution for simultaneous edits
- [ ] Test real-time synchronization between multiple users
- [ ] Test subscription cleanup and memory leak prevention
- [ ] Verify performance with multiple collaborators

**Git Commit:** `feat(sharing): add real-time collaboration features`

---

### Phase 6: Integration & Polish

- [ ] Update `src/hooks/useWordLists.ts` to show shared status
- [ ] Enhance `src/pages/WordListDetail.tsx` with collaborative features
- [ ] Add loading states and error handling throughout
- [ ] Implement share link management (disable, regenerate)
- [ ] Add success/error toasts for user feedback
- [ ] Ensure mobile responsiveness for all new components
- [ ] Add keyboard navigation and accessibility features
- [ ] Test end-to-end sharing flows

**Git Commit:** `feat(sharing): integrate sharing features and polish UX`

---

### Phase 7: Enhanced Word List Management

- [ ] Update existing word list components to handle collaborative mode
- [ ] Add "Manage Sharing" button for list owners
- [ ] Implement collaborator management UI (add/remove collaborators)
- [ ] Add visual indicators for shared vs private lists
- [ ] Update word list cards to show collaborator count
- [ ] Add sharing settings to list edit dialog
- [ ] Test all word list operations in collaborative mode

**Git Commit:** `feat(sharing): enhance word list management for collaboration`

---

### Phase 8: Testing & Validation

**Automated Tests:**

- [ ] Unit test: `useSharedLists` hooks with mock Supabase client
- [ ] Unit test: `useCollaborativeLists` Realtime subscription handling
- [ ] Component test: `ShareWordListDialog` mode selection and submission
- [ ] Component test: `ShareLinkDisplay` copy functionality
- [ ] Component test: `SharedList` landing page flows
- [ ] Integration test: Complete sharing flow (create → share → import)
- [ ] Integration test: Real-time collaboration between users

**Manual Validation:**

- [ ] Test share link generation for both modes
- [ ] Test copy import with authenticated user
- [ ] Test copy import with anonymous user
- [ ] Test collaborative list joining and real-time sync
- [ ] Test permission boundaries (users can't access unowned lists)
- [ ] Test expired/invalid share links
- [ ] Test SRS progress isolation between users
- [ ] Test concurrent editing and conflict resolution
- [ ] Test mobile responsiveness and accessibility
- [ ] Test performance with large word lists (1000+ words)

**Git Commit:** `test(sharing): add comprehensive tests and validate flows`

---

### Phase 9: Documentation & Deployment

- [ ] Update API documentation with sharing endpoints
- [ ] Add sharing feature documentation to README
- [ ] Create user guide for sharing functionality
- [ ] Test migration on staging environment
- [ ] Verify RLS policies in production
- [ ] Monitor Realtime performance and costs
- [ ] Deploy to production with feature flag if needed

**Git Commit:** `docs(sharing): add documentation and prepare for deployment`

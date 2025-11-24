# Word List Sharing - Manual Setup

This document outlines any manual configuration steps required for the word list sharing feature.

## Environment Variables

No new environment variables are required for this feature. The sharing functionality uses the existing Supabase configuration.

## Supabase Configuration

### 1. Realtime Configuration

The sharing feature requires Supabase Realtime to be enabled. This is typically enabled by default, but verify:

```sql
-- Check if Realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

If the `words` and `list_collaborators` tables are not listed, run:

```sql
-- Enable Realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.words;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_collaborators;
```

### 2. RLS Policy Verification

After running the migration, verify RLS policies are working:

```sql
-- Test RLS policies
-- 1. Create test user and list
-- 2. Share the list
-- 3. Try to access with different user
-- 4. Verify permissions work correctly
```

### 3. Database Function Permissions

Ensure the database functions have proper permissions:

```sql
-- Verify function permissions
SELECT proname, proacl FROM pg_proc WHERE proname LIKE '%shared%';
```

## Frontend Configuration

### 1. Router Configuration

Add the shared list route to your router configuration:

```typescript
// In your main router file (e.g., src/App.tsx or router configuration)
{
  path: '/shared/:token',
  element: <SharedList />
}
```

### 2. Shadcn Components

Install required Shadcn components:

```bash
npx shadcn-ui@latest add dialog alert-dialog card badge input
```

## Testing Configuration

### 1. Test Users

For testing collaborative features, create multiple test user accounts:

1. User A: List owner
2. User B: Collaborator
3. User C: Another collaborator

### 2. Test Data

Create test word lists with various scenarios:

- Small lists (5-10 words)
- Medium lists (50-100 words)
- Large lists (1000+ words)
- Lists with special characters in terms
- Lists with long definitions

## Performance Considerations

### 1. Realtime Subscription Limits

Monitor Realtime subscription usage:

```sql
-- Check active Realtime connections
SELECT * FROM pg_stat_activity WHERE application_name LIKE '%realtime%';
```

### 2. Database Indexes

Verify performance indexes are created:

```sql
-- Check indexes on sharing tables
SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('shared_lists', 'list_collaborators');
```

## Security Considerations

### 1. Share Token Security

- Tokens are 128-bit cryptographically secure
- No expiration by default (can be added later)
- Rate limiting should be considered for share link access

### 2. Access Control

- RLS policies handle most access control
- Anonymous users can only import copy mode
- Collaborative mode requires authentication

## Monitoring

### 1. Database Metrics

Monitor these metrics after deployment:

- Shared list creation rate
- Collaborative list usage
- Realtime connection count
- Database query performance

### 2. Error Tracking

Set up error tracking for:

- Invalid share token attempts
- Realtime connection failures
- Permission denied errors
- Collaborative sync conflicts

## Rollback Plan

If issues arise, the feature can be disabled by:

1. Disabling the route in the frontend
2. Revoking database function permissions
3. Setting `is_active = false` on all shared_lists records

```sql
-- Emergency disable
UPDATE public.shared_lists SET is_active = false;
REVOKE EXECUTE ON FUNCTION public.create_shared_list(UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.import_shared_list_copy(TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.join_collaborative_list(TEXT) FROM authenticated;
```

## Future Enhancements

Consider these future improvements:

1. **Share Link Expiration**: Add optional expiration dates
2. **Permission Levels**: Read-only collaborators vs full editors
3. **Share Analytics**: Track how many times lists are shared/accessed
4. **Bulk Sharing**: Share multiple lists at once
5. **Public Gallery**: Browse publicly shared lists
6. **Version History**: Track changes to collaborative lists
7. **Offline Support**: Cache collaborative lists for offline editing

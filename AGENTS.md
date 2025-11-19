# EduPuzzle Agent Guidelines

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **Hosting**: Railway (backend) / Netlify (frontend)
- **Styling**: Tailwind CSS

## Commands

- **Build**: `npm run build` (tsc + vite build)
- **Lint**: `npm run lint` (eslint ts/tsx, max-warnings 0)
- **Test**: `npm test` (vitest all), `npm run test:unit` (src only), `npm run test:int` (integration), `npm run test:e2e` (e2e)
- **Run single test**: `npx vitest run path/to/test.spec.ts`

## Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── lib/            # Utilities, Supabase client
├── types/          # TypeScript types
└── pages/          # Route pages
```

## Code Style

- **TypeScript**: Strict mode, no `any`, explicit types everywhere, type guards for validation
- **Formatting**: Prettier (no semicolons, single quotes, 2 spaces, trailing comma es5, 100 width)
- **Linting**: No unused vars (ignore `_` prefix), no explicit any
- **React**: `memo()` all components with props, `useMemo()` for computations, `useCallback()` for handlers, functional components with hooks
- **Exports**: Named exports preferred
- **Naming**: Descriptive variable names (avoid abbreviations), camelCase vars/functions, PascalCase components/types, kebab-case files/utilities
- **Imports**: Absolute paths `@/`, group by external/internal, sort alphabetically
- **Error Handling**: `AppError` class with code/statusCode, server-side validation first

## Supabase Patterns

```typescript
// Query pattern
const { data, error } = await supabase.from('word_lists').select('*').eq('user_id', userId)

// Always handle errors
if (error) throw error
```

## Architecture Rules

- **Server-side**: Complex algorithms, >100ms ops, non-deterministic logic, caching
- **Client-side**: CRUD via Supabase, UI state, simple filtering
- **Business Logic**: Edge Functions only, never client
- **Data Flow**: Client → React Query → Supabase/Edge Function → Response

## Performance Targets

- Crossword generation: <2s for 15x15 grid
- Initial page load: <3s
- Time to Interactive: <5s

## Key Features

1. Word list creation
2. Daily crossword generation
3. Spaced repetition system
4. Progress tracking
5. Stripe subscription (7-day trial, <€10/month)

## Domain Knowledge

- **Spaced Repetition**: SM-2 algorithm with performance categories
- **Crossword Algorithm**: Two-phase (pre-clustering + progressive generation)
- **Target Users**: Students (price-sensitive, mobile-first)</content>
  <parameter name="filePath">AGENTS.md

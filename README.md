# EDU-PUZZLE

A desktop-first vocabulary learning web application that combines Spaced Repetition Learning with crossword puzzle gamification.

## Overview

EDU-PUZZLE helps users learn vocabulary through automatically generated crossword puzzles. An intelligent algorithm determines the optimal repetition time for each vocabulary word using scientifically-backed spaced repetition principles.

## Features

- 🧩 **Intelligent Crossword Generation**: Automatically creates connected puzzles with no islands
- 📚 **Vocabulary Management**: Create and manage custom word lists
- 🔄 **Spaced Repetition System**: Scientific learning intervals for optimal retention
- 💳 **Subscription Model**: 7-day free trial, then €6.99/month
- 📊 **Progress Tracking**: Detailed statistics and learning analytics

## Tech Stack

- **Frontend**: React 18, TypeScript 5, Vite 5
- **Styling**: TailwindCSS 3.x, shadcn/ui
- **State Management**: Zustand, React Query
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Stripe
- **Hosting**: Netlify (Frontend), Supabase Cloud (Backend)

## Getting Started

### Prerequisites

- Node.js 18+ or later
- pnpm 8+
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd EduPuzzle
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase and Stripe credentials in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`

4. Initialize Supabase (if using local development):
   ```bash
   pnpm supabase:init
   ```

5. Run database migrations:
   ```bash
   pnpm supabase:migrate
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

## Project Structure

```
src/
├── components/          # React components
│   ├── puzzle/         # Crossword puzzle components
│   ├── words/          # Word list management
│   ├── subscription/   # Payment & subscription
│   └── ui/            # Shared UI components (shadcn/ui)
├── lib/
│   ├── algorithms/     # Puzzle generation algorithms
│   ├── srs/           # Spaced repetition engine
│   └── supabase.ts    # Supabase client
├── hooks/             # Custom React hooks
├── pages/             # Page components (routes)
├── stores/            # Zustand stores
├── types/             # TypeScript type definitions
└── test/              # Test utilities
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests
- `pnpm test:int` - Run integration tests
- `pnpm test:e2e` - Run end-to-end tests

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and subscription status
- `word_lists` - User's vocabulary collections
- `words` - Individual vocabulary words
- `word_progress` - SRS tracking per user/word
- `puzzle_sessions` - Generated puzzles
- `word_reviews` - Individual word performance

See `supabase/migrations/20250113_initial_schema.sql` for the complete schema.

## Puzzle Generation Algorithm

The crossword puzzle generation uses an "Incremental Best-Fit" approach:

1. Analyzes word compatibility based on shared letters
2. Places longest word first in the center
3. Finds optimal crossing points for each word
4. Validates connectivity after each placement
5. Splits into multiple puzzles if needed

Key constraints:
- 100% word coverage (all due words included)
- No disconnected clusters (fully connected grid)
- < 5 seconds generation time

## Spaced Repetition Intervals

- Level 0: 1 day
- Level 1: 3 days
- Level 2: 7 days
- Level 3: 14 days
- Level 4: 30 days
- Level 5: 90 days
- Level 6: 180 days

Review types:
- **Perfect**: Correct immediately → advance level
- **Half Known**: Correct after hints → advance level
- **Conditional**: 30-70% revealed → same level
- **Unknown**: Incorrect → reset to level 0
- **Not Evaluated**: >70% revealed → no change

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

Proprietary - All rights reserved

## Development Roadmap

See `SpecificationDocument.md` for the complete development roadmap and technical specifications.

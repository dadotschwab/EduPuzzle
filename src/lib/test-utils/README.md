# Test Utilities for Crossword Generation

This directory contains comprehensive testing infrastructure for the crossword puzzle generation algorithm.

## Overview

The test utilities simulate the Spaced Repetition System (SRS) by randomly selecting words from curated datasets, allowing you to test the crossword generation algorithm without waiting for real SRS intervals.

## Dataset Statistics

| Dataset | Word Count | Difficulty | Use Case |
|---------|-----------|------------|----------|
| **Easy** | ~210 words | High crossing potential | Algorithm validation |
| **Medium** | ~250 words | Balanced distribution | Realistic testing |
| **Hard** | ~250+ words | Rare letters (Q,X,Z,J,K,V,W) | Stress testing |
| **Mixed** | ~250 words | Combination of all | Production simulation |

## Quick Start

### Basic Usage

```typescript
import { generateMockSRSWords, EASY_DATASET } from '@/lib/test-utils'

// Generate 30-50 random words (simulates daily SRS selection)
const mockWords = generateMockSRSWords(EASY_DATASET.words)

// Use with your puzzle generator
const puzzles = await generatePuzzles(mockWords)
```

### Using Pre-Configured Scenarios

```typescript
import { getStandardMixedScenario, getAllScenarios } from '@/lib/test-utils'

// Get a single scenario
const scenario = getStandardMixedScenario()
console.log(scenario.name) // "Standard Mixed (30-50 words)"
console.log(scenario.words.length) // Random 30-50

// Run all scenarios for comprehensive testing
const allScenarios = getAllScenarios()
for (const scenario of allScenarios) {
  const puzzles = await generatePuzzles(scenario.words)
  console.log(`${scenario.name}: ${puzzles.length} puzzles generated`)
}
```

### Deterministic Testing

```typescript
import { generateFixedMockWords, MEDIUM_DATASET } from '@/lib/test-utils'

// Generate same 40 words every time (for unit tests)
const words = generateFixedMockWords(MEDIUM_DATASET.words, 40, 123) // seed = 123
```

### Custom Word Selection

```typescript
import { filterWordsByLength, EASY_DATASET } from '@/lib/test-utils'

// Get only 5-7 letter words
const mediumLength = filterWordsByLength(EASY_DATASET.words, 5, 7)
const mockWords = generateMockSRSWords(mediumLength, { minWords: 25, maxWords: 35 })
```

## Available Scenarios

### Standard Scenarios
- `getQuickTestScenario()` - 10 easy words (rapid testing)
- `getStandardEasyScenario()` - 30-50 easy words (typical daily review)
- `getStandardMediumScenario()` - 30-50 medium words
- `getStandardHardScenario()` - 30-50 hard words (stress test)
- `getStandardMixedScenario()` - 30-50 mixed words (most realistic)

### Stress Tests
- `getLargeBatchScenario()` - 80-100 words (maximum load)

### Edge Cases
- `getSingleWordScenario()` - 1 word (minimal puzzle)
- `getTwoWordsScenario()` - 2 words (basic crossing)
- `getShortWordsScenario()` - 30 words of 3-4 letters
- `getLongWordsScenario()` - 30 words of 8+ letters
- `getNoOverlapScenario()` - 20 words with minimal overlap
- `getHighOverlapScenario()` - 40 words with high overlap

## Utility Functions

### `generateMockSRSWords(wordBank, config?)`
Simulates SRS selection by randomly picking words.

**Parameters:**
- `wordBank: TestWord[]` - Source dataset
- `config?: { minWords: number, maxWords: number }` - Range (default: 30-50)

**Returns:** `Word[]` - Array of full Word objects with generated IDs

### `generateFixedMockWords(wordBank, count, seed?)`
Generates deterministic word selection for unit tests.

**Parameters:**
- `wordBank: TestWord[]` - Source dataset
- `count: number` - Exact number of words
- `seed?: number` - Random seed for reproducibility

**Returns:** `Word[]` - Array of words

### `analyzeLetterFrequency(words)`
Analyzes letter distribution in a word set.

**Returns:** `Map<string, number>` - Letter frequency map

### `filterWordsByLength(words, minLength, maxLength)`
Filters words by character count.

**Returns:** `TestWord[]` - Filtered array

## Integration with Algorithm

When implementing the crossword generation algorithm, structure it to accept `Word[]` as input:

```typescript
// src/lib/algorithms/generator.ts
export async function generatePuzzles(words: Word[]): Promise<Puzzle[]> {
  // Your algorithm here
  // Works with both mock data and real SRS words
}

// During development (with mock data)
import { generateMockSRSWords, MIXED_DATASET } from '@/lib/test-utils'
const mockWords = generateMockSRSWords(MIXED_DATASET.words)
const puzzles = await generatePuzzles(mockWords)

// In production (with real SRS)
const srsWords = await getDueWordsFromDatabase(userId)
const puzzles = await generatePuzzles(srsWords)
```

**Key Benefit:** Zero code changes needed when switching from testing to production!

## Testing Workflow

### 1. Development Phase
```typescript
// Quick validation with small dataset
const quickTest = getQuickTestScenario()
const puzzles = await generatePuzzles(quickTest.words)
console.log(`Generated ${puzzles.length} puzzle(s)`)
```

### 2. Algorithm Refinement
```typescript
// Test against all scenarios
for (const getScenario of ALL_SCENARIOS) {
  const scenario = getScenario()
  const startTime = Date.now()
  const puzzles = await generatePuzzles(scenario.words)
  const duration = Date.now() - startTime

  console.log(`${scenario.name}:`)
  console.log(`  - Words: ${scenario.words.length}`)
  console.log(`  - Puzzles: ${puzzles.length}`)
  console.log(`  - Time: ${duration}ms`)
  console.log(`  - Expected: ${scenario.expectedPuzzles || 'N/A'}`)
}
```

### 3. Performance Benchmarking
```typescript
// Stress test with large batch
const stressTest = getLargeBatchScenario()
const results = []

for (let i = 0; i < 10; i++) {
  const start = performance.now()
  await generatePuzzles(stressTest.words)
  const end = performance.now()
  results.push(end - start)
}

const avgTime = results.reduce((a, b) => a + b) / results.length
console.log(`Average generation time: ${avgTime.toFixed(2)}ms`)
console.log(`Max time: ${Math.max(...results).toFixed(2)}ms`)
```

## Directory Structure

```
test-utils/
├── README.md              # This file
├── index.ts              # Main exports
├── types.ts              # TypeScript interfaces
├── mockWords.ts          # Word generation utilities
├── scenarios.ts          # Pre-configured test cases
└── wordBanks/
    ├── index.ts          # Dataset exports
    ├── easy.ts           # ~210 easy words
    ├── medium.ts         # ~250 medium words
    └── hard.ts           # ~250 hard words
```

## Best Practices

1. **Use scenarios for comprehensive testing** - Run all scenarios regularly
2. **Use fixed seeds for unit tests** - Ensures reproducible results
3. **Use random selection for integration tests** - Catches edge cases
4. **Start with easy dataset** - Validates basic algorithm logic
5. **Progress to hard dataset** - Identifies weaknesses
6. **Always test with mixed dataset** - Simulates real usage

## Adding New Datasets

To add a new word bank:

1. Create `src/lib/test-utils/wordBanks/custom.ts`
2. Export an array of `TestWord` objects
3. Add to `wordBanks/index.ts`:
```typescript
import { CUSTOM_WORDS } from './custom'

export const CUSTOM_DATASET: WordDataset = {
  name: 'Custom Words',
  difficulty: 'mixed',
  description: 'Description here',
  words: CUSTOM_WORDS
}
```

## Future Enhancements

- [ ] Add multilingual word banks (German, French, Spanish)
- [ ] Add domain-specific datasets (medical, technical, business terms)
- [ ] Add performance metrics to scenarios
- [ ] Add visual difficulty scores
- [ ] Generate reports comparing algorithm versions

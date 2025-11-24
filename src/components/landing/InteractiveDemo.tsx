import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPuzzle } from './AnimatedPuzzle'

interface InteractiveDemoProps {
  className?: string
}

// Simple demo puzzle generation - creates a basic grid from input words
function generateDemoPuzzle(words: string[]): any {
  // Create a simple 5x5 grid with the first few letters
  const grid = Array(5)
    .fill(null)
    .map(() => Array(5).fill(''))

  // Place first word horizontally
  if (words[0]) {
    for (let i = 0; i < Math.min(words[0].length, 5); i++) {
      grid[0][i] = words[0][i].toUpperCase()
    }
  }

  // Place second word vertically
  if (words[1]) {
    for (let i = 0; i < Math.min(words[1].length, 5); i++) {
      grid[i][0] = words[1][i].toUpperCase()
    }
  }

  // Add some crossing letters
  if (words[0] && words[1]) {
    // Find common letters and place them
    const commonLetters = words[0].split('').filter((letter) => words[1].includes(letter))
    if (commonLetters.length > 0) {
      const letter = commonLetters[0]
      const pos1 = words[0].indexOf(letter)
      const pos2 = words[1].indexOf(letter)
      if (pos1 >= 0 && pos2 >= 0 && pos1 < 5 && pos2 < 5) {
        grid[pos2][pos1] = letter.toUpperCase()
      }
    }
  }

  return { grid, words: words.slice(0, 2) }
}

export function InteractiveDemo({ className }: InteractiveDemoProps) {
  const [inputWords, setInputWords] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedPuzzle, setGeneratedPuzzle] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateDemo = async () => {
    const words = inputWords
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0)

    if (words.length < 2) {
      setError('Please enter at least 2 words separated by commas')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const puzzle = generateDemoPuzzle(words)
      setGeneratedPuzzle(puzzle)
    } catch (err) {
      setError('Failed to generate puzzle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="demo" className={`py-20 bg-white ${className || ''}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">See AI in Action</h2>
          <p className="text-xl text-gray-600">
            Enter some vocabulary words and watch our AI create a crossword puzzle
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div>
              <label htmlFor="words-input" className="block text-sm font-medium text-gray-700 mb-2">
                Enter vocabulary words (separated by commas)
              </label>
              <Input
                id="words-input"
                placeholder="apple, play, game, puzzle, learn..."
                value={inputWords}
                onChange={(e) => setInputWords(e.target.value)}
                className="w-full"
              />
            </div>

            <Button onClick={handleGenerateDemo} disabled={loading} className="w-full" size="lg">
              {loading ? 'Generating Puzzle...' : 'Create Puzzle'}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">How it works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter vocabulary words you want to learn</li>
                <li>Our AI analyzes word compatibility and lengths</li>
                <li>A crossword puzzle is automatically generated</li>
                <li>Words are placed to maximize crossings and learning</li>
              </ol>
            </div>
          </div>

          <div className="relative">
            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <div className="text-center">
                  <p className="text-sm text-gray-600 animate-pulse">
                    AI is analyzing your words...
                  </p>
                </div>
              </div>
            )}

            {generatedPuzzle && !loading && (
              <div className="space-y-4">
                <AnimatedPuzzle className="mx-auto" />
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Puzzle generated with {generatedPuzzle.words?.length || 0} words!
                  </p>
                </div>
              </div>
            )}

            {!generatedPuzzle && !loading && (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500">Enter words above to see the magic happen!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

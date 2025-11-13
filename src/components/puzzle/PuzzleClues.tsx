/**
 * @fileoverview Crossword clues panel with controls
 *
 * Displays:
 * - Puzzle control buttons in horizontal layout (Check, Hint, End)
 * - Across and Down clues in single container separated by vertical divider
 * - Up to 10 clues per column without scrolling
 * - Highlights currently selected clue
 *
 * @module components/puzzle/PuzzleClues
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Lightbulb, Check } from 'lucide-react'
import type { PlacedWord } from '@/types'

interface PuzzleCluesProps {
  placedWords: PlacedWord[]
  selectedWord: PlacedWord | null
  onWordSelect: (word: PlacedWord) => void
  onCheckPuzzle: () => void
  onEndPuzzle: () => void
  onGiveHint: () => void
  hintsRemaining: number
  checkedWords: Record<string, 'correct' | 'incorrect'>
}

/**
 * Renders the clues section with controls
 * Clues are organized in Across and Down columns
 */
export function PuzzleClues({
  placedWords,
  selectedWord,
  onWordSelect,
  onCheckPuzzle,
  onEndPuzzle,
  onGiveHint,
  hintsRemaining,
  checkedWords
}: PuzzleCluesProps) {
  // Separate words into across and down, sorted by number
  const acrossWords = placedWords
    .filter(w => w.direction === 'horizontal')
    .sort((a, b) => a.number - b.number)

  const downWords = placedWords
    .filter(w => w.direction === 'vertical')
    .sort((a, b) => a.number - b.number)

  /**
   * Renders a single clue item
   */
  const ClueItem = ({ word }: { word: PlacedWord }) => {
    const isSelected = selectedWord?.id === word.id
    const isCorrect = checkedWords[word.id] === 'correct'

    return (
      <button
        onClick={() => onWordSelect(word)}
        className={`
          w-full text-left px-3 py-2 rounded-md transition-colors
          flex items-start gap-2
          ${isSelected
            ? 'bg-blue-100 text-blue-900 font-medium'
            : 'hover:bg-gray-100 text-gray-700'
          }
        `}
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="font-bold">{word.number}.</span>
          <span className="text-sm">{word.clue}</span>
        </div>
        {isCorrect && (
          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Control Buttons - Horizontal Layout */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Button
            onClick={onCheckPuzzle}
            variant="outline"
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Check
          </Button>
          <Button
            onClick={onGiveHint}
            variant="outline"
            className="flex-1"
            disabled={hintsRemaining <= 0}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Hint ({hintsRemaining})
          </Button>
          <Button
            onClick={onEndPuzzle}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            End
          </Button>
        </div>
      </div>

      {/* Clues - Single Container with Divider */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex overflow-hidden p-6">
          {/* Across Clues */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="font-bold text-base mb-3">Across</h3>
            <div className="flex-1 overflow-y-auto space-y-1">
              {acrossWords.map(word => (
                <ClueItem key={word.id} word={word} />
              ))}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-gray-200 mx-6 my-0" />

          {/* Down Clues */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="font-bold text-base mb-3">Down</h3>
            <div className="flex-1 overflow-y-auto space-y-1">
              {downWords.map(word => (
                <ClueItem key={word.id} word={word} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

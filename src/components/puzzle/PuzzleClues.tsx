/**
 * @fileoverview Crossword clues panel with controls
 *
 * Displays:
 * - Puzzle control buttons (Check, End, Hint)
 * - Across and Down clues in two columns
 * - Up to 10 clues per column without scrolling
 * - Highlights currently selected clue
 *
 * @module components/puzzle/PuzzleClues
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react'
import type { PlacedWord } from '@/types'

interface PuzzleCluesProps {
  placedWords: PlacedWord[]
  selectedWord: PlacedWord | null
  onWordSelect: (word: PlacedWord) => void
  onCheckPuzzle: () => void
  onEndPuzzle: () => void
  onGiveHint: () => void
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
  onGiveHint
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

    return (
      <button
        onClick={() => onWordSelect(word)}
        className={`
          w-full text-left px-3 py-2 rounded-md transition-colors
          ${isSelected
            ? 'bg-blue-100 text-blue-900 font-medium'
            : 'hover:bg-gray-100 text-gray-700'
          }
        `}
      >
        <span className="font-bold mr-2">{word.number}.</span>
        <span className="text-sm">{word.clue}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Control Buttons */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Puzzle Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              onClick={onCheckPuzzle}
              variant="outline"
              className="w-full justify-start"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Check Puzzle
            </Button>
            <Button
              onClick={onGiveHint}
              variant="outline"
              className="w-full justify-start"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Give Hint
            </Button>
            <Button
              onClick={onEndPuzzle}
              variant="destructive"
              className="w-full justify-start"
            >
              <XCircle className="w-4 h-4 mr-2" />
              End Puzzle
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Clues - Two Column Layout */}
      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
        {/* Across Clues */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Across</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {acrossWords.map(word => (
                <ClueItem key={word.id} word={word} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Down Clues */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Down</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {downWords.map(word => (
                <ClueItem key={word.id} word={word} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

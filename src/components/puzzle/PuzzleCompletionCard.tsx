/**
 * @fileoverview Puzzle completion card component
 *
 * Displays puzzle results, statistics, and navigation controls
 * after completing a puzzle. Shared between TodaysPuzzles and PuzzleSolver.
 *
 * @module components/puzzle/PuzzleCompletionCard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight } from 'lucide-react'

interface PuzzleStats {
  totalWords: number
  correctWords: number
  incorrectWords: number
  hintsUsed: number
}

interface PuzzleCompletionCardProps {
  stats: PuzzleStats
  showCorrectAnswers: boolean
  onToggleAnswersView: (show: boolean) => void
  onNext: () => void
  nextButtonLabel?: string
  showNextButton?: boolean
  onContinuePracticing?: () => void
  continuePracticingInfo?: {
    wordsPracticed: number
    wordsRemaining: number
  }
}

/**
 * Completion card shown after finishing a puzzle
 *
 * @param stats - Puzzle performance statistics
 * @param showCorrectAnswers - Whether to show correct answers view
 * @param onToggleAnswersView - Handler for toggling answer view
 * @param onNext - Handler for next puzzle/navigation
 * @param nextButtonLabel - Custom label for next button (default: "Next Puzzle")
 * @param showNextButton - Whether to show the next button (default: true)
 * @param onContinuePracticing - Optional handler for continuing to next batch
 * @param continuePracticingInfo - Info about session progress (words practiced/remaining)
 */
export function PuzzleCompletionCard({
  stats,
  showCorrectAnswers,
  onToggleAnswersView,
  onNext,
  nextButtonLabel = 'Next Puzzle',
  showNextButton = true,
  onContinuePracticing,
  continuePracticingInfo,
}: PuzzleCompletionCardProps) {
  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <CardTitle className="text-xl">Puzzle Completed!</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.totalWords}</div>
            <div className="text-xs text-blue-600 mt-1">Total Words</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.correctWords}</div>
            <div className="text-xs text-green-600 mt-1">Correct</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{stats.incorrectWords}</div>
            <div className="text-xs text-red-600 mt-1">Incorrect</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.hintsUsed}</div>
            <div className="text-xs text-purple-600 mt-1">Hints Used</div>
          </div>
        </div>

        {/* Performance Message */}
        <div className="text-center py-4">
          {stats.incorrectWords === 0 ? (
            <div className="text-green-700 font-semibold">
              Perfect! All words correct! 🎉
            </div>
          ) : stats.correctWords > stats.incorrectWords ? (
            <div className="text-blue-700 font-semibold">
              Great job! Keep it up! 👏
            </div>
          ) : (
            <div className="text-orange-700 font-semibold">
              Good effort! Try the next one! 💪
            </div>
          )}
        </div>

        {/* Toggle View Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onToggleAnswersView(false)}
            variant={!showCorrectAnswers ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            My Answers
          </Button>
          <Button
            onClick={() => onToggleAnswersView(true)}
            variant={showCorrectAnswers ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            Correct Answers
          </Button>
        </div>

        {/* Session Progress (if available) */}
        {continuePracticingInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="text-sm text-blue-900 text-center">
              <div className="font-semibold mb-1">Session Progress</div>
              <div>
                You've practiced <strong>{continuePracticingInfo.wordsPracticed}</strong> words.
              </div>
              <div className="text-blue-700 mt-1">
                <strong>{continuePracticingInfo.wordsRemaining}</strong> more words are due today.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-4">
          {/* Continue Practicing Button (if available) */}
          {onContinuePracticing && continuePracticingInfo && continuePracticingInfo.wordsRemaining > 0 && (
            <Button
              onClick={onContinuePracticing}
              className="w-full"
              size="lg"
              variant="default"
            >
              Continue Practicing
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {/* Next/Dashboard Button */}
          {showNextButton && (
            <Button
              onClick={onNext}
              className="w-full"
              size="lg"
              variant={onContinuePracticing ? "outline" : "default"}
            >
              {nextButtonLabel}
              {nextButtonLabel.toLowerCase().includes('next') && (
                <ArrowRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

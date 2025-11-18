/**
 * @fileoverview Help dialog explaining puzzle controls and interactions
 *
 * Provides a comprehensive guide for:
 * - Keyboard navigation
 * - Mouse interactions
 * - Button functions
 *
 * @module components/puzzle/PuzzleHelpDialog
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Keyboard, Mouse, Gamepad2 } from 'lucide-react'

interface PuzzleHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Help dialog that explains all puzzle controls and interactions
 */
export function PuzzleHelpDialog({ open, onOpenChange }: PuzzleHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How to Solve Puzzles</DialogTitle>
          <DialogDescription>
            Learn all the ways to interact with your crossword puzzle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Keyboard Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Keyboard Controls</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">A-Z</kbd>
                <span className="text-gray-700">Type letters directly. Auto-advances to next cell in the word.</span>
              </div>
              <div className="flex gap-3">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Arrow Keys</kbd>
                <span className="text-gray-700">Navigate between cells in any direction.</span>
              </div>
              <div className="flex gap-3">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Tab</kbd>
                <span className="text-gray-700">Jump to the next word in the puzzle.</span>
              </div>
              <div className="flex gap-3">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd>
                <span className="text-gray-700">Toggle between across/down words (only at cells where both words start).</span>
              </div>
              <div className="flex gap-3">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Backspace</kbd>
                <span className="text-gray-700">Delete current letter or move back in active word if cell is empty.</span>
              </div>
            </div>
          </div>

          {/* Mouse Controls */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mouse className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Mouse Controls</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="font-medium text-gray-900 min-w-[100px]">Click Cell</span>
                <span className="text-gray-700">Select a word. Click again to toggle direction at intersections.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium text-gray-900 min-w-[100px]">Click Clue</span>
                <span className="text-gray-700">Jump to that word and focus the first cell for immediate typing.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium text-gray-900 min-w-[100px]">Cell Numbers</span>
                <span className="text-gray-700">When you see two numbers (e.g., "1 2"), the cell starts multiple words.</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Buttons</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="font-medium text-gray-900 min-w-[100px]">Check</span>
                <span className="text-gray-700">Validate your answers. Correct words show green, incorrect show red.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium text-gray-900 min-w-[100px]">Hint</span>
                <span className="text-gray-700">Reveal one letter in the selected word. You have 3 hints per puzzle.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium text-gray-900 min-w-[100px]">Complete</span>
                <span className="text-gray-700">Finish the puzzle and see your results. Updates your learning progress.</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 text-blue-900">Tips for Success</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Selected word cells are highlighted in light blue</li>
              <li>• Currently focused cell has a blue ring</li>
              <li>• Clues with checkmarks are correct</li>
              <li>• Use Tab to quickly navigate between words</li>
              <li>• Don't worry about mistakes - you can always check and revise</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

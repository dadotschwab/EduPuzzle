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
import { Button } from '@/components/ui/button'
import { Keyboard, CheckCircle, Lightbulb, Flag } from 'lucide-react'

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
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center">A-Z</kbd>
                <span className="text-gray-700">Type letters directly. Auto-advances to next cell in the word.</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>↑ ↓ ← →</span>
                </kbd>
                <span className="text-gray-700">Navigate between cells in any direction.</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>⇥</span> <span className="text-[10px]">Tab</span>
                </kbd>
                <span className="text-gray-700">Jump to the next word in the puzzle.</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>↵</span> <span className="text-[10px]">Enter</span>
                </kbd>
                <span className="text-gray-700">Toggle between across/down words (only at cells where both words start).</span>
              </div>
              <div className="flex gap-3 items-center">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono min-w-[60px] text-center flex items-center justify-center gap-1">
                  <span>⌫</span> <span className="text-[10px]">Back</span>
                </kbd>
                <span className="text-gray-700">Delete current letter or move back in active word if cell is empty.</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Buttons</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-center">
                <Button variant="outline" size="sm" className="min-w-[100px] pointer-events-none">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check
                </Button>
                <span className="text-gray-700">Validate your answers. Correct words show green, incorrect show red.</span>
              </div>
              <div className="flex gap-3 items-center">
                <Button variant="outline" size="sm" className="min-w-[100px] pointer-events-none">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Hint (3)
                </Button>
                <span className="text-gray-700">Reveal one letter in the selected word. You have 3 hints per puzzle.</span>
              </div>
              <div className="flex gap-3 items-center">
                <Button size="sm" className="min-w-[100px] pointer-events-none">
                  <Flag className="w-4 h-4 mr-2" />
                  Complete
                </Button>
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
              <li>• Don't worry about mistakes - you can always check and revise</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * @fileoverview Google Docs-style sharing dialog for word lists
 *
 * This component provides a clean interface for sharing word lists with
 * two modes: static copy and collaborative editing.
 */

import { useState } from 'react'
import { Copy, Link } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useShareLink } from '@/hooks/useShareLink'
import type { WordList, ShareMode } from '@/types'

interface ShareWordListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wordList: WordList
}

export function ShareWordListDialog({ open, onOpenChange, wordList }: ShareWordListDialogProps) {
  const [selectedMode, setSelectedMode] = useState<ShareMode>('copy')
  const { generatedLink, isGenerating, generateShareLink, copyToClipboard, clearLink } =
    useShareLink()

  const handleGenerateLink = async () => {
    try {
      await generateShareLink(wordList.id, selectedMode)
      console.log('Share link generated successfully')
    } catch (error) {
      console.error('Failed to generate share link:', error)
      // Could add toast notification here if toast library is available
    }
  }

  const handleCopyLink = async () => {
    try {
      await copyToClipboard()
      console.log('Link copied to clipboard')
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    clearLink()
    setSelectedMode('copy')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Share "{wordList.name}"
          </DialogTitle>
          <DialogDescription>Choose how you want to share this word list</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share mode selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sharing Options</Label>
            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  id="copy"
                  name="shareMode"
                  value="copy"
                  checked={selectedMode === 'copy'}
                  onChange={(e) => setSelectedMode(e.target.value as ShareMode)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="copy" className="text-sm font-medium cursor-pointer">
                    Share as copy
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recipients get their own copy of the list
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  id="collaborative"
                  name="shareMode"
                  value="collaborative"
                  checked={selectedMode === 'collaborative'}
                  onChange={(e) => setSelectedMode(e.target.value as ShareMode)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="collaborative" className="text-sm font-medium cursor-pointer">
                    Share as collaborative
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Everyone can edit the same list in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Generated share link */}
          {generatedLink && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                />
                <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {!generatedLink ? (
            <Button onClick={handleGenerateLink} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Link'}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

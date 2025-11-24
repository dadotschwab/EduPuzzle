/**
 * @fileoverview Component for displaying and copying shareable links
 *
 * This component shows the generated share link with a copy button
 * and provides appropriate messaging based on the sharing mode.
 */

import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { ShareMode } from '@/types'

interface ShareLinkDisplayProps {
  link: string
  shareMode: ShareMode
  onCopy: () => void
}

export function ShareLinkDisplay({ link, shareMode, onCopy }: ShareLinkDisplayProps) {
  const getModeDescription = () => {
    switch (shareMode) {
      case 'copy':
        return 'Anyone with this link can import a copy of this word list'
      case 'collaborative':
        return 'Anyone with this link can join and edit this word list collaboratively'
      default:
        return 'Share this link to give others access to the word list'
    }
  }

  const handleCopyClick = () => {
    onCopy()
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Share Link</Label>
        <p className="text-xs text-muted-foreground mt-1">{getModeDescription()}</p>
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={link}
          readOnly
          className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono"
          aria-label="Share link"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyClick}
          className="shrink-0"
          aria-label="Copy link to clipboard"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

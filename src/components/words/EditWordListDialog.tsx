import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateWordList } from '@/hooks/useWordLists'
import type { WordList } from '@/types'

interface EditWordListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wordList: WordList
}

export function EditWordListDialog({ open, onOpenChange, wordList }: EditWordListDialogProps) {
  const [name, setName] = useState(wordList.name)
  const [sourceLanguage, setSourceLanguage] = useState(wordList.sourceLanguage)
  const [targetLanguage, setTargetLanguage] = useState(wordList.targetLanguage)
  const updateMutation = useUpdateWordList()

  useEffect(() => {
    if (open) {
      setName(wordList.name)
      setSourceLanguage(wordList.sourceLanguage)
      setTargetLanguage(wordList.targetLanguage)
    }
  }, [open, wordList])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateMutation.mutateAsync({
        id: wordList.id,
        updates: {
          name,
          sourceLanguage,
          targetLanguage,
        },
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update word list:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Word List</DialogTitle>
          <DialogDescription>Update your vocabulary list details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">List Name</Label>
            <Input
              id="name"
              placeholder="e.g., Spanish Vocabulary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceLanguage">Source Language</Label>
            <Input
              id="sourceLanguage"
              placeholder="e.g., English"
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language</Label>
            <Input
              id="targetLanguage"
              placeholder="e.g., Spanish"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update List'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

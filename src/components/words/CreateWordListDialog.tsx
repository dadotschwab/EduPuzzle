import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateWordList } from '@/hooks/useWordLists'

interface CreateWordListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWordListDialog({ open, onOpenChange }: CreateWordListDialogProps) {
  const [name, setName] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const createMutation = useCreateWordList()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createMutation.mutateAsync({
        name,
        sourceLanguage,
        targetLanguage,
      })

      // Reset form and close
      setName('')
      setSourceLanguage('')
      setTargetLanguage('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create word list:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Word List</DialogTitle>
          <DialogDescription>
            Create a new vocabulary list to start learning
          </DialogDescription>
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

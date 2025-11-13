import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateWord } from '@/hooks/useWords'

interface CreateWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listId: string
}

export function CreateWordDialog({ open, onOpenChange, listId }: CreateWordDialogProps) {
  const [term, setTerm] = useState('')
  const [translation, setTranslation] = useState('')
  const [definition, setDefinition] = useState('')
  const [exampleSentence, setExampleSentence] = useState('')
  const createMutation = useCreateWord()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createMutation.mutateAsync({
        listId,
        term,
        translation,
        definition: definition || undefined,
        exampleSentence: exampleSentence || undefined,
      })

      // Reset form and close
      setTerm('')
      setTranslation('')
      setDefinition('')
      setExampleSentence('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create word:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Word</DialogTitle>
          <DialogDescription>Add a new word to your vocabulary list</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="term">Term (Word) *</Label>
            <Input
              id="term"
              placeholder="e.g., Apple"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="translation">Translation (Clue) *</Label>
            <Input
              id="translation"
              placeholder="e.g., A fruit"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="definition">Definition (Optional)</Label>
            <Input
              id="definition"
              placeholder="e.g., A round fruit with red or green skin"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exampleSentence">Example Sentence (Optional)</Label>
            <Input
              id="exampleSentence"
              placeholder="e.g., I ate an apple for breakfast"
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
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
              {createMutation.isPending ? 'Adding...' : 'Add Word'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

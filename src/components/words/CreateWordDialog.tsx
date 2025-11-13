import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateWords } from '@/hooks/useWords'
import { Trash2 } from 'lucide-react'

interface CreateWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listId: string
}

interface WordRow {
  id: string
  term: string
  translation: string
  exampleSentence: string
}

const MAX_ROWS = 10

export function CreateWordDialog({ open, onOpenChange, listId }: CreateWordDialogProps) {
  const [rows, setRows] = useState<WordRow[]>([
    { id: '1', term: '', translation: '', exampleSentence: '' }
  ])
  const createMutation = useCreateWords()

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setRows([{ id: '1', term: '', translation: '', exampleSentence: '' }])
    }
  }, [open])

  const handleInputChange = (id: string, field: keyof WordRow, value: string) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )

      // Auto-add new row if current row has both term and translation filled
      const currentRow = updatedRows.find(r => r.id === id)
      const isLastRow = updatedRows[updatedRows.length - 1].id === id

      if (
        currentRow &&
        currentRow.term.trim() &&
        currentRow.translation.trim() &&
        isLastRow &&
        updatedRows.length < MAX_ROWS
      ) {
        updatedRows.push({
          id: Date.now().toString(),
          term: '',
          translation: '',
          exampleSentence: ''
        })
      }

      return updatedRows
    })
  }

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(prevRows => prevRows.filter(row => row.id !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty rows (only include rows with both term and translation)
    const validWords = rows
      .filter(row => row.term.trim() && row.translation.trim())
      .map(row => ({
        listId,
        term: row.term.trim(),
        translation: row.translation.trim(),
        exampleSentence: row.exampleSentence.trim() || undefined,
      }))

    if (validWords.length === 0) {
      return
    }

    try {
      await createMutation.mutateAsync(validWords)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create words:', error)
    }
  }

  const hasValidWords = rows.some(row => row.term.trim() && row.translation.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Words</DialogTitle>
          <DialogDescription>
            Add up to {MAX_ROWS} words at once. A new row will appear automatically when you fill in both word and translation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-[1fr_1fr_1.5fr_40px] gap-2 pb-2 border-b font-medium text-sm text-muted-foreground">
              <div>Word *</div>
              <div>Translation *</div>
              <div>Example Sentence</div>
              <div></div>
            </div>

            {/* Data Rows */}
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_1.5fr_40px] gap-2 items-center">
                <Input
                  placeholder="e.g., Apple"
                  value={row.term}
                  onChange={(e) => handleInputChange(row.id, 'term', e.target.value)}
                  className="h-9"
                />
                <Input
                  placeholder="e.g., Apfel"
                  value={row.translation}
                  onChange={(e) => handleInputChange(row.id, 'translation', e.target.value)}
                  className="h-9"
                />
                <Input
                  placeholder="e.g., I ate an apple"
                  value={row.exampleSentence}
                  onChange={(e) => handleInputChange(row.id, 'exampleSentence', e.target.value)}
                  className="h-9"
                />
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleRemoveRow(row.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !hasValidWords}
            >
              {createMutation.isPending ? 'Adding...' : `Add ${rows.filter(r => r.term.trim() && r.translation.trim()).length} Word(s)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

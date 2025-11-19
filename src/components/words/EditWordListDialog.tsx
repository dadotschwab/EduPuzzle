import { useState, useEffect, useCallback, memo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFormButtons } from '@/components/ui/dialog-form-buttons'
import { LanguageSelector } from '@/components/words/LanguageSelector'
import { useUpdateWordList } from '@/hooks/useWordLists'
import type { WordList } from '@/types'

interface EditWordListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wordList: WordList
}

export const EditWordListDialog = memo(function EditWordListDialog({ open, onOpenChange, wordList }: EditWordListDialogProps) {
  const [name, setName] = useState(wordList.name)
  const [source_language, setSourceLanguage] = useState(wordList.source_language)
  const [target_language, setTargetLanguage] = useState(wordList.target_language)
  const updateMutation = useUpdateWordList()

  useEffect(() => {
    if (open) {
      setName(wordList.name)
      setSourceLanguage(wordList.source_language)
      setTargetLanguage(wordList.target_language)
    }
  }, [open, wordList])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateMutation.mutateAsync({
        id: wordList.id,
        updates: {
          name,
          source_language,
          target_language,
        },
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update word list:', error)
    }
  }, [name, source_language, target_language, wordList.id, updateMutation, onOpenChange])

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
            <LanguageSelector
              value={source_language}
              onChange={setSourceLanguage}
              placeholder="Select source language..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language</Label>
            <LanguageSelector
              value={target_language}
              onChange={setTargetLanguage}
              placeholder="Select target language..."
            />
          </div>

          <DialogFormButtons
            onCancel={() => onOpenChange(false)}
            submitLabel="Update List"
            loadingLabel="Updating..."
            isLoading={updateMutation.isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
})

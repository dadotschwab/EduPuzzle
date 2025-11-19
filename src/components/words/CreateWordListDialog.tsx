import { useState, useRef, useCallback, memo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFormButtons } from '@/components/ui/dialog-form-buttons'
import { LanguageSelector, type LanguageSelectorRef } from '@/components/words/LanguageSelector'
import { useCreateWordList } from '@/hooks/useWordLists'

interface CreateWordListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateWordListDialog = memo(function CreateWordListDialog({ open, onOpenChange }: CreateWordListDialogProps) {
  const [name, setName] = useState('')
  const [source_language, setSourceLanguage] = useState('')
  const [target_language, setTargetLanguage] = useState('')
  const createMutation = useCreateWordList()

  // Refs for auto-advancing between fields
  const sourceLanguageRef = useRef<LanguageSelectorRef>(null)
  const targetLanguageRef = useRef<LanguageSelectorRef>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createMutation.mutateAsync({
        name,
        source_language,
        target_language,
      })

      // Reset form and close
      setName('')
      setSourceLanguage('')
      setTargetLanguage('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create word list:', error)
    }
  }, [name, source_language, target_language, createMutation, onOpenChange])

  const handleTargetFocus = useCallback(() => {
    targetLanguageRef.current?.focus()
  }, [])

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
            <LanguageSelector
              ref={sourceLanguageRef}
              value={source_language}
              onChange={setSourceLanguage}
              onSelect={handleTargetFocus}
              placeholder="Select source language..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language</Label>
            <LanguageSelector
              ref={targetLanguageRef}
              value={target_language}
              onChange={setTargetLanguage}
              placeholder="Select target language..."
            />
          </div>

          <DialogFormButtons
            onCancel={() => onOpenChange(false)}
            submitLabel="Create List"
            loadingLabel="Creating..."
            isLoading={createMutation.isPending}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
})

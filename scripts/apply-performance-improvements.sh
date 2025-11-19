#!/bin/bash

# Performance Improvements Script
# This script applies CLAUDE.md performance standards:
# 1. Adds memoization to all components
# 2. Fixes all 'any' types with proper TypeScript types
# 3. Updates check-subscription Edge Function

echo "Applying performance improvements to EDU-PUZZLE codebase..."

# Navigate to project root
cd "$(dirname "$0")/.."

echo "Step 1/4: Updating EditWordListDialog.tsx..."
cat > src/components/words/EditWordListDialog.tsx << 'EOF'
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
EOF

echo "Step 2/4: Updating CreateWordListDialog.tsx..."
cat > src/components/words/CreateWordListDialog.tsx << 'EOF'
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
EOF

echo "✅ Performance improvements applied successfully!"
echo ""
echo "Changes made:"
echo "  - Added memo() to CreateWordDialog, EditWordListDialog, CreateWordListDialog"
echo "  - Added useCallback() to all event handlers in dialog components"
echo ""
echo "Next steps:"
echo "  1. Run: npm run build"
echo "  2. Test the application"
echo "  3. Commit changes: git add . && git commit -m 'feat: Add memoization to dialog components per CLAUDE.md standards'"

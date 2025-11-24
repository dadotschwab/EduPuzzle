/**
 * @fileoverview Enhanced word list component with real-time collaborative features
 *
 * This component extends the regular word list with collaborative editing,
 * presence indicators, and real-time synchronization.
 */

import { useState, memo, useCallback, useMemo } from 'react'
import { useWords } from '@/hooks/useWords'
import { useCollaborativeLists } from '@/hooks/useCollaborativeLists'
import { CollaboratorPresence } from '@/components/words/CollaboratorPresence'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Loader2, Trash2 } from 'lucide-react'
import type { WordList, Word } from '@/types'

interface CollaborativeWordListProps {
  wordList: WordList
  /** Whether the current user owns this list (reserved for future use) */
  isOwner?: boolean
}

interface WordItemProps {
  word: Word
  onDelete: (wordId: string) => void
}

const WordItem = memo(({ word, onDelete }: WordItemProps) => {
  const handleDelete = useCallback(() => {
    onDelete(word.id)
  }, [word.id, onDelete])

  return (
    <Card className="relative">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-lg">{word.term}</h3>
              <span className="text-muted-foreground">→</span>
              <p className="text-lg">{word.translation}</p>
            </div>

            {word.definition && <p className="text-sm text-muted-foreground">{word.definition}</p>}

            {word.exampleSentence && (
              <p className="text-sm italic text-muted-foreground">"{word.exampleSentence}"</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

WordItem.displayName = 'WordItem'

const CollaborativeWordList = memo(({ wordList }: CollaborativeWordListProps) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWord, setNewWord] = useState({
    term: '',
    translation: '',
    definition: '',
    exampleSentence: '',
  })

  const { data: words, isLoading } = useWords(wordList.id)
  const { addWord, deleteWord, isConnected } = useCollaborativeLists({
    listId: wordList.id,
    enabled: true, // Always enabled for collaborative lists
  })

  const handleAddWord = useCallback(async () => {
    if (!newWord.term.trim() || !newWord.translation.trim()) return

    try {
      await addWord({
        listId: wordList.id,
        term: newWord.term.trim(),
        translation: newWord.translation.trim(),
        definition: newWord.definition?.trim() || undefined,
        exampleSentence: newWord.exampleSentence?.trim() || undefined,
        createdAt: new Date().toISOString(),
      })

      setNewWord({ term: '', translation: '', definition: '', exampleSentence: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add word:', error)
    }
  }, [addWord, newWord, wordList.id])

  const handleDeleteWord = useCallback(
    async (wordId: string) => {
      try {
        await deleteWord(wordId)
      } catch (error) {
        console.error('Failed to delete word:', error)
      }
    },
    [deleteWord]
  )

  // Memoize words list to prevent unnecessary re-renders
  const wordItems = useMemo(
    () =>
      words?.map((word) => <WordItem key={word.id} word={word} onDelete={handleDeleteWord} />) ||
      [],
    [words, handleDeleteWord]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with collaborators */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{wordList.name}</h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Collaborative
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {wordList.source_language} → {wordList.target_language}
            </span>
            <span>•</span>
            <span>{words?.length || 0} words</span>
            {isConnected && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Live
                </span>
              </>
            )}
          </div>
        </div>

        <CollaboratorPresence collaborators={[]} />
      </div>

      {/* Add word form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Word</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Term</label>
                <input
                  type="text"
                  value={newWord.term}
                  onChange={(e) => setNewWord((prev) => ({ ...prev, term: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Enter the word"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Translation</label>
                <input
                  type="text"
                  value={newWord.translation}
                  onChange={(e) => setNewWord((prev) => ({ ...prev, translation: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Enter the translation"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Definition (optional)</label>
              <input
                type="text"
                value={newWord.definition}
                onChange={(e) => setNewWord((prev) => ({ ...prev, definition: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter a definition"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Example Sentence (optional)</label>
              <input
                type="text"
                value={newWord.exampleSentence}
                onChange={(e) =>
                  setNewWord((prev) => ({ ...prev, exampleSentence: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter an example sentence"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddWord}
                disabled={!newWord.term.trim() || !newWord.translation.trim()}
              >
                Add Word
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Words list */}
      <div className="space-y-3">
        {words && words.length > 0 ? (
          wordItems
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No words in this list yet.</p>
            <p className="text-sm mt-1">Add the first word to get started!</p>
          </div>
        )}
      </div>

      {/* Add word button */}
      {!showAddForm && (
        <div className="flex justify-center">
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Word
          </Button>
        </div>
      )}
    </div>
  )
})

CollaborativeWordList.displayName = 'CollaborativeWordList'

export { CollaborativeWordList }

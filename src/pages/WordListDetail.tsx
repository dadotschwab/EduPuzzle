import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWordList } from '@/hooks/useWordLists'
import { useWords, useDeleteWord } from '@/hooks/useWords'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateWordDialog } from '@/components/words/CreateWordDialog'
import { ArrowLeft, Plus, Trash2, BookOpen } from 'lucide-react'

export function WordListDetail() {
  const { id } = useParams<{ id: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { data: wordList, isLoading: listLoading } = useWordList(id!)
  const { data: words, isLoading: wordsLoading } = useWords(id!)
  const deleteMutation = useDeleteWord()

  const handleDelete = async (wordId: string, term: string) => {
    if (confirm(`Are you sure you want to delete "${term}"?`)) {
      try {
        await deleteMutation.mutateAsync(wordId)
      } catch (error) {
        console.error('Failed to delete word:', error)
      }
    }
  }

  if (listLoading || wordsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!wordList) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center py-12">
          <p className="text-destructive">Word list not found</p>
          <Link to="/app/lists">
            <Button className="mt-4">Go Back</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to="/app/lists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lists
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{wordList.name}</h1>
            <p className="text-muted-foreground">
              {wordList.sourceLanguage} → {wordList.targetLanguage}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {words?.length || 0} {words?.length === 1 ? 'word' : 'words'}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Word
          </Button>
        </div>

        {words && words.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No words yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first word to start building your vocabulary
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Word
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {words?.map((word) => (
              <Card key={word.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{word.term}</CardTitle>
                      <p className="text-muted-foreground">{word.translation}</p>
                      {word.definition && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Definition:</span> {word.definition}
                        </p>
                      )}
                      {word.exampleSentence && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{word.exampleSentence}"
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(word.id, word.term)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <CreateWordDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          listId={id!}
        />
      </div>
    </div>
  )
}

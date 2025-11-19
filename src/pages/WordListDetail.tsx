import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWordList } from '@/hooks/useWordLists'
import { useWords, useDeleteWord } from '@/hooks/useWords'
import { AppLayout } from '@/components/layout/AppLayout'
import { SubscriptionGate } from '@/components/auth/SubscriptionGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!wordList) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-destructive">Word list not found</p>
            <Link to="/app">
              <Button className="mt-4">Go Back</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <SubscriptionGate feature="Advanced word list management">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link to="/app">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{wordList.name}</h1>
              <p className="text-muted-foreground">
                {wordList.source_language} → {wordList.target_language}
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
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-sm">Word</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Translation</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Example Sentence
                        </th>
                        <th className="w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {words?.map((word) => (
                        <tr
                          key={word.id}
                          className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium">{word.term}</td>
                          <td className="py-3 px-4 text-muted-foreground">{word.translation}</td>
                          <td className="py-3 px-4 text-muted-foreground italic">
                            {word.exampleSentence || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(word.id, word.term)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <CreateWordDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            listId={id!}
          />
        </div>
      </SubscriptionGate>
    </AppLayout>
  )
}

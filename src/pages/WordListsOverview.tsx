import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWordLists, useDeleteWordList } from '@/hooks/useWordLists'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateWordListDialog } from '@/components/words/CreateWordListDialog'
import { Trash2, BookOpen, Plus } from 'lucide-react'

export function WordListsOverview() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { data: wordLists, isLoading, error } = useWordLists()
  const deleteMutation = useDeleteWordList()

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will also delete all words in this list.`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete word list:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading word lists...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load word lists</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Word Lists</h1>
            <p className="text-muted-foreground">Create and manage your vocabulary lists</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New List
          </Button>
        </div>

        {wordLists && wordLists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No word lists yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first word list to start learning vocabulary
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wordLists?.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{list.name}</CardTitle>
                  <CardDescription>
                    {list.sourceLanguage} → {list.targetLanguage}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link to={`/app/lists/${list.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Words
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(list.id, list.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateWordListDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </div>
  )
}

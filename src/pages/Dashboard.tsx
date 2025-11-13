import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWordListsWithCounts } from '@/hooks/useWordListsWithCounts'
import { useDeleteWordList } from '@/hooks/useWordLists'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateWordListDialog } from '@/components/words/CreateWordListDialog'
import { EditWordListDialog } from '@/components/words/EditWordListDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, Plus, MoreVertical, Edit, Trash2, PlayCircle, PuzzleIcon } from 'lucide-react'
import type { WordList } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<WordList | null>(null)
  const { data: wordLists, isLoading } = useWordListsWithCounts()
  const deleteMutation = useDeleteWordList()

  const handleEdit = (list: WordList) => {
    setSelectedList(list)
    setEditDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will also delete all words in this list.`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete word list:', error)
      }
    }
  }

  const handleCardClick = (listId: string) => {
    navigate(`/app/lists/${listId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Continue your vocabulary learning journey with EDU-PUZZLE
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button size="lg" onClick={() => navigate('/app/review')} className="flex-1 md:flex-none">
            <PlayCircle className="w-5 h-5 mr-2" />
            Play Today's Puzzles
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
            className="flex-1 md:flex-none"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Word List
          </Button>
        </div>

        {/* Word Lists Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Word Lists</h2>
        </div>

        {wordLists && wordLists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No word lists yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first word list to start learning vocabulary with crossword puzzles
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wordLists?.map((list) => (
              <Card
                key={list.id}
                className="hover:shadow-lg transition-shadow cursor-pointer relative"
              >
                {/* Card Header with Menu */}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => handleCardClick(list.id)}>
                      <CardTitle className="mb-1">{list.name}</CardTitle>
                      <CardDescription>
                        {list.sourceLanguage} → {list.targetLanguage}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
                      </p>
                    </div>

                    {/* 3-Dot Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(list)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit List
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(list.id, list.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                {/* Card Actions */}
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/app/lists/${list.id}`)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Word
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/app/puzzle/${list.id}`)}
                    >
                      <PuzzleIcon className="w-4 h-4 mr-1" />
                      Start Puzzle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CreateWordListDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        {selectedList && (
          <EditWordListDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            wordList={selectedList}
          />
        )}
      </div>
    </div>
  )
}

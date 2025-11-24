import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWordLists, useDeleteWordList } from '@/hooks/useWordLists'
import { useDueWordsCount } from '@/hooks/useTodaysPuzzles'
import { useJoinedCollaborativeLists } from '@/hooks/useSharedLists'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateWordListDialog } from '@/components/words/CreateWordListDialog'
import { EditWordListDialog } from '@/components/words/EditWordListDialog'
import { CreateWordDialog } from '@/components/words/CreateWordDialog'
import { ShareWordListDialog } from '@/components/words/ShareWordListDialog'
import { LeaveCollaborativeListDialog } from '@/components/words/LeaveCollaborativeListDialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BookOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  PlayCircle,
  PuzzleIcon,
  Share,
  Users,
  LogOut,
} from 'lucide-react'
import type { WordList } from '@/types'
import type { WordListWithCount } from '@/hooks/useWordLists'

export function Dashboard() {
  const navigate = useNavigate()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addWordDialogOpen, setAddWordDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<WordList | null>(null)
  const [listToDelete, setListToDelete] = useState<{ id: string; name: string } | null>(null)
  const [listToLeave, setListToLeave] = useState<{ sharedListId: string; name: string } | null>(
    null
  )
  const { data: wordLists, isLoading } = useWordLists({ withCounts: true }) as {
    data: WordListWithCount[] | undefined
    isLoading: boolean
  }
  const { data: joinedLists } = useJoinedCollaborativeLists()
  const deleteMutation = useDeleteWordList()
  const { data: dueCount } = useDueWordsCount()

  // Create a map of original_list_id -> shared_list_id for joined collaborative lists
  const joinedListsMap = useMemo(() => {
    const map = new Map<string, string>()
    if (joinedLists) {
      for (const item of joinedLists) {
        if (item.shared_list?.original_list_id) {
          map.set(item.shared_list.original_list_id, item.shared_list.id)
        }
      }
    }
    return map
  }, [joinedLists])

  const handleDeleteConfirm = async () => {
    if (!listToDelete) return
    try {
      await deleteMutation.mutateAsync(listToDelete.id)
      setListToDelete(null)
    } catch (error) {
      console.error('Failed to delete word list:', error)
    }
  }

  const handleCardClick = (listId: string) => {
    navigate(`/app/lists/${listId}`)
  }

  if (isLoading) {
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Continue your vocabulary learning journey with EDU-PUZZLE
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            size="lg"
            onClick={() => navigate('/app/todays-puzzles')}
            className="flex-1 md:flex-none"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Learn Today's Words
            {dueCount && dueCount > 0 ? ` (${dueCount > 99 ? '99+' : dueCount})` : ''}
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
            {wordLists?.map((list) => {
              return (
                <Card
                  key={list.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer relative"
                  onClick={() => handleCardClick(list.id)}
                >
                  {/* Card Header with Menu */}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="mb-1">{list.name}</CardTitle>
                        <CardDescription>
                          {list.source_language} → {list.target_language}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
                          </p>
                          {list.is_shared && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              <Users className="h-3 w-3" />
                              <span>Shared</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3-Dot Menu */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedList(list)
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit List
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedList(list)
                                setShareDialogOpen(true)
                              }}
                            >
                              <Share className="w-4 h-4 mr-2" />
                              Share List
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Show Leave option for collaborative lists the user has joined */}
                            {joinedListsMap.has(list.id) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setListToLeave({
                                    sharedListId: joinedListsMap.get(list.id)!,
                                    name: list.name,
                                  })
                                  setLeaveDialogOpen(true)
                                }}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave List
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setListToDelete({ id: list.id, name: list.name })
                                setDeleteDialogOpen(true)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete List
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Card Actions */}
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedList(list)
                          setAddWordDialogOpen(true)
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Word
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/app/puzzle/${list.id}`)
                        }}
                      >
                        <PuzzleIcon className="w-4 h-4 mr-1" />
                        Start Puzzle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Dialogs */}
        <CreateWordListDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {selectedList && (
          <>
            <EditWordListDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              wordList={selectedList}
            />
            <ShareWordListDialog
              open={shareDialogOpen}
              onOpenChange={setShareDialogOpen}
              wordList={selectedList}
            />
            <CreateWordDialog
              open={addWordDialogOpen}
              onOpenChange={setAddWordDialogOpen}
              listId={selectedList.id}
            />
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Word List</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{listToDelete?.name}"? This will permanently delete
                the list and all{' '}
                {wordLists?.find((l: WordList) => l.id === listToDelete?.id)?.wordCount || 0} words
                in it. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Leave Collaborative List Dialog */}
        {listToLeave && (
          <LeaveCollaborativeListDialog
            open={leaveDialogOpen}
            onOpenChange={(open) => {
              setLeaveDialogOpen(open)
              if (!open) setListToLeave(null)
            }}
            sharedListId={listToLeave.sharedListId}
            listName={listToLeave.name}
          />
        )}
      </div>
    </AppLayout>
  )
}

export default function DashboardPage() {
  return (
    <ErrorBoundary
      fallback={
        <AppLayout>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
            <p className="text-muted-foreground mb-4">
              We encountered an issue loading your dashboard. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Dashboard
            </button>
          </div>
        </AppLayout>
      }
    >
      <Dashboard />
    </ErrorBoundary>
  )
}

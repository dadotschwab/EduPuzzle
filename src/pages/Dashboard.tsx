import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWordLists, useDeleteWordList } from '@/hooks/useWordLists'
import { useDueWordsCount } from '@/hooks/useTodaysPuzzles'
import { useJoinedCollaborativeLists } from '@/hooks/useSharedLists'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { StreakDisplay } from '@/components/dashboard/StreakDisplay'
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
  const { user } = useAuth()
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
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent"></div>
            <p className="text-muted-foreground mt-4">Loading your workspace...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with gradient */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 via-violet-900 to-slate-900 bg-clip-text text-transparent">
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p className="text-slate-600 text-lg">
              Continue your vocabulary journey with crossword puzzles
            </p>
          </div>

          {/* Streak Display - positioned next to welcome text on desktop */}
          <div className="hidden lg:block">
            <StreakDisplay />
          </div>
        </div>

        {/* Mobile: Show streak below welcome text */}
        <div className="lg:hidden mb-4">
          <StreakDisplay />
        </div>

        {/* Action Buttons with vibrant styling */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            size="lg"
            onClick={() => navigate('/app/todays-puzzles')}
            className="flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 shadow-lg shadow-violet-200 text-lg h-14"
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            Learn Today's Words
            {dueCount && dueCount > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {dueCount > 99 ? '99+' : dueCount}
              </span>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
            className="flex-1 sm:flex-none border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-lg h-14"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Word List
          </Button>
        </div>

        {/* Word Lists Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Your Word Lists</h2>
          <p className="text-slate-600 mt-1">Manage and practice your vocabulary collections</p>
        </div>

        {wordLists && wordLists.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200">
            <CardContent className="py-16 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 mb-4">
                <BookOpen className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No word lists yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first word list to start learning vocabulary with crossword puzzles
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="shadow-lg shadow-violet-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wordLists?.map((list, index) => {
              const accentColors = [
                'from-violet-500 to-purple-500',
                'from-pink-500 to-rose-500',
                'from-amber-500 to-orange-500',
              ]
              const bgColors = ['bg-violet-50', 'bg-pink-50', 'bg-amber-50']
              const textColors = ['text-violet-600', 'text-pink-600', 'text-amber-600']
              const colorIndex = index % 3

              return (
                <Card
                  key={list.id}
                  className="group hover:shadow-xl transition-all duration-200 cursor-pointer relative overflow-hidden"
                  onClick={() => handleCardClick(list.id)}
                >
                  {/* Gradient accent bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColors[colorIndex]}`}
                  />

                  {/* Card Header with Menu */}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`h-10 w-10 rounded-xl ${bgColors[colorIndex]} flex items-center justify-center`}
                          >
                            <BookOpen className={`h-5 w-5 ${textColors[colorIndex]}`} />
                          </div>
                          <CardTitle className="text-lg">{list.name}</CardTitle>
                        </div>
                        <CardDescription className="font-medium">
                          {list.source_language} → {list.target_language}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-semibold text-slate-700">
                            {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
                          </span>
                          {list.is_shared && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-slate-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
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
                        className="flex-1 hover:bg-slate-50"
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
                        className={`flex-1 bg-gradient-to-r ${accentColors[colorIndex]} hover:opacity-90 shadow-md`}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/app/puzzle/${list.id}`)
                        }}
                      >
                        <PuzzleIcon className="w-4 h-4 mr-1" />
                        Play
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
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
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

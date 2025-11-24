import { useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWordList } from '@/hooks/useWordLists'
import { useWords, useDeleteWord } from '@/hooks/useWords'
import { AppLayout } from '@/components/layout/AppLayout'
import { SubscriptionGate } from '@/components/auth/SubscriptionGate'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateWordDialog } from '@/components/words/CreateWordDialog'
import { ArrowLeft, Plus, Trash2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'

const WORDS_PER_PAGE = 50

export function WordListDetail() {
  const { id } = useParams<{ id: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const { data: wordList, isLoading: listLoading } = useWordList(id!)
  const { data: words, isLoading: wordsLoading } = useWords(id!)
  const deleteMutation = useDeleteWord()

  // Pagination calculations
  const totalWords = words?.length || 0
  const totalPages = Math.ceil(totalWords / WORDS_PER_PAGE)

  // Memoize paginated words to prevent unnecessary recalculations
  const paginatedWords = useMemo(() => {
    if (!words) return []
    const startIndex = (currentPage - 1) * WORDS_PER_PAGE
    const endIndex = startIndex + WORDS_PER_PAGE
    return words.slice(startIndex, endIndex)
  }, [words, currentPage])

  // Reset to page 1 when words change (e.g., after adding/deleting words)
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleDelete = useCallback(
    async (wordId: string, term: string) => {
      if (confirm(`Are you sure you want to delete "${term}"?`)) {
        try {
          await deleteMutation.mutateAsync(wordId)
          // If we deleted the last word on this page, go to previous page
          if (paginatedWords.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1)
          }
        } catch (error) {
          console.error('Failed to delete word:', error)
        }
      }
    },
    [deleteMutation, paginatedWords.length, currentPage]
  )

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

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
                {totalWords} {totalWords === 1 ? 'word' : 'words'}
                {totalPages > 1 && (
                  <span className="ml-2">
                    • Page {currentPage} of {totalPages}
                  </span>
                )}
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
                      {paginatedWords.map((word) => (
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * WORDS_PER_PAGE + 1} to{' '}
                      {Math.min(currentPage * WORDS_PER_PAGE, totalWords)} of {totalWords} words
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
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

export default function WordListDetailPage() {
  return (
    <ErrorBoundary
      fallback={
        <AppLayout>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Word List Error</h2>
            <p className="text-muted-foreground mb-4">
              We encountered an issue loading your word list. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload List
            </button>
          </div>
        </AppLayout>
      }
    >
      <WordListDetail />
    </ErrorBoundary>
  )
}

/**
 * @fileoverview Landing page for shared word list links
 *
 * This page handles shared list links, allowing users to either import
 * copies of word lists or join collaborative lists.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSharedList, useImportSharedList } from '@/hooks/useSharedLists'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Users, Copy } from 'lucide-react'

export function SharedList() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isImporting, setIsImporting] = useState(false)

  const {
    data: sharedList,
    isLoading: isLoadingSharedList,
    error: sharedListError,
  } = useSharedList(token!)

  const importMutation = useImportSharedList()

  useEffect(() => {
    if (!token) {
      navigate('/')
    }
  }, [token, navigate])

  const handleImportOrJoin = async () => {
    if (!sharedList || !token) return

    setIsImporting(true)
    try {
      const result = await importMutation.mutateAsync({
        token,
        mode: sharedList.share_mode,
      })

      // Navigate to the imported/joined list
      if (sharedList.share_mode === 'copy') {
        navigate(`/word-lists/${result}`)
      } else {
        navigate(`/word-lists/${sharedList.original_list.id}`)
      }
    } catch (error) {
      console.error('Failed to import/join shared list:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleAnonymousImport = async () => {
    if (!sharedList || !token) return

    // For anonymous users, only allow copy mode
    if (sharedList.share_mode !== 'copy') {
      return
    }

    setIsImporting(true)
    try {
      const result = await importMutation.mutateAsync({
        token,
        mode: 'copy',
      })

      // Navigate to the imported list
      navigate(`/word-lists/${result}`)
    } catch (error) {
      console.error('Failed to import shared list:', error)
    } finally {
      setIsImporting(false)
    }
  }

  // Loading state
  if (isLoadingSharedList) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared list...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (sharedListError || !sharedList) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Link
            </CardTitle>
            <CardDescription>This shared list link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { original_list: list, share_mode: shareMode } = sharedList

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {shareMode === 'collaborative' ? (
              <Users className="h-12 w-12 text-blue-500" />
            ) : (
              <Copy className="h-12 w-12 text-green-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            {shareMode === 'copy' ? 'Shared Word List' : 'Collaborative Word List'}
          </CardTitle>
          <CardDescription>
            {shareMode === 'copy'
              ? 'Import this word list to your account'
              : 'Join this collaborative word list to edit together'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* List Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{list.name}</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{list.wordCount} words</p>
              <p>
                {list.source_language} → {list.target_language}
              </p>
            </div>
          </div>

          {/* Authentication Check */}
          {user ? (
            <Button
              onClick={handleImportOrJoin}
              disabled={isImporting || importMutation.isPending}
              className="w-full"
              size="lg"
            >
              {isImporting || importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {shareMode === 'copy' ? 'Importing...' : 'Joining...'}
                </>
              ) : shareMode === 'copy' ? (
                'Import List'
              ) : (
                'Join List'
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/login')}
                variant="default"
                className="w-full"
                size="lg"
              >
                Sign in to {shareMode === 'copy' ? 'import' : 'join'}
              </Button>

              {shareMode === 'copy' && (
                <Button
                  onClick={handleAnonymousImport}
                  variant="outline"
                  className="w-full"
                  disabled={isImporting || importMutation.isPending}
                >
                  {isImporting || importMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    'Continue as guest'
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {importMutation.error && (
            <div className="flex items-center gap-2 p-3 border border-red-200 bg-red-50 rounded-md text-red-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Failed to {shareMode === 'copy' ? 'import' : 'join'} the list. Please try again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

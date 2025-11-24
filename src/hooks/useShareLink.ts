/**
 * @fileoverview Hook for generating and managing share links
 *
 * This hook provides functionality for creating shareable links
 * with proper URL construction and clipboard operations.
 */

import { useState } from 'react'
import { useCreateShareLink } from '@/hooks/useSharedLists'
import type { ShareMode, CreateSharedListResult } from '@/types'

/**
 * Hook for managing share link generation and clipboard operations
 */
export function useShareLink() {
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const createShareLinkMutation = useCreateShareLink()

  /**
   * Generate a share link for a word list
   */
  const generateShareLink = async (listId: string, shareMode: ShareMode) => {
    try {
      const result = await createShareLinkMutation.mutateAsync({ listId, shareMode })
      // PostgreSQL RETURNS TABLE comes back as an array, so access first element
      const resultArray = result as CreateSharedListResult[] | CreateSharedListResult
      const shareToken = Array.isArray(resultArray)
        ? resultArray[0]?.share_token
        : resultArray?.share_token

      if (!shareToken) {
        throw new Error('No share token returned from server')
      }

      // Construct the full share URL
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/shared/${shareToken}`

      setGeneratedLink(shareUrl)
      return shareUrl
    } catch (error) {
      console.error('Failed to generate share link:', error)
      throw error
    }
  }

  /**
   * Copy the generated link to clipboard
   */
  const copyToClipboard = async () => {
    if (!generatedLink) {
      throw new Error('No link to copy')
    }

    try {
      await navigator.clipboard.writeText(generatedLink)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = generatedLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  /**
   * Clear the generated link
   */
  const clearLink = () => {
    setGeneratedLink('')
  }

  return {
    generatedLink,
    isGenerating: createShareLinkMutation.isPending,
    generateShareLink,
    copyToClipboard,
    clearLink,
  }
}

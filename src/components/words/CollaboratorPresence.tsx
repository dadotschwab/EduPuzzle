/**
 * @fileoverview Component to display online collaborators
 *
 * Shows a list of collaborators with online/offline status indicators
 * for collaborative word lists.
 */

import { Badge } from '@/components/ui/badge'
import type { Collaborator } from '@/types'

interface CollaboratorPresenceProps {
  collaborators: Collaborator[]
  maxDisplay?: number
}

export function CollaboratorPresence({ collaborators, maxDisplay = 3 }: CollaboratorPresenceProps) {
  const onlineCollaborators = collaborators.filter((c) => c.isOnline)
  const offlineCollaborators = collaborators.filter((c) => !c.isOnline)

  const displayCollaborators = [...onlineCollaborators, ...offlineCollaborators].slice(
    0,
    maxDisplay
  )
  const remainingCount = collaborators.length - displayCollaborators.length

  if (collaborators.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        {displayCollaborators.map((collaborator) => (
          <div key={collaborator.id} className="flex items-center gap-1">
            <Badge
              variant={collaborator.isOnline ? 'default' : 'secondary'}
              className="text-xs px-2 py-0"
            >
              {collaborator.user?.email?.split('@')[0] || 'Anonymous'}
            </Badge>
            {collaborator.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
          </div>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs px-2 py-0">
            +{remainingCount}
          </Badge>
        )}
      </div>
      <span className="text-xs">
        {onlineCollaborators.length > 0 && `${onlineCollaborators.length} online`}
      </span>
    </div>
  )
}

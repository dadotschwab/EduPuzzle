import { BuddySettings } from '@/components/settings/BuddySettings'

export function Buddy() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Learning Buddy</h2>
        <p className="text-muted-foreground mt-2">
          Connect with another learner for mutual accountability and motivation
        </p>
      </div>

      <BuddySettings />
    </div>
  )
}

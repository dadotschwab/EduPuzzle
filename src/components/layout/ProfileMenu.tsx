import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useBuddy } from '@/hooks/useBuddy'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings, LogOut, Users } from 'lucide-react'

export function ProfileMenu() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { hasBuddy, buddyName, buddyHasLearnedToday } = useBuddy()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10 bg-primary/10 hover:bg-primary/20"
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            <p className="text-xs leading-none text-muted-foreground">Free Plan</p>
          </div>
        </div>

        {/* Buddy Status Indicator */}
        <div className="flex items-center justify-start gap-2 p-2 bg-muted/50">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col space-y-1 flex-1">
            <p className="text-xs font-medium leading-none">
              {hasBuddy ? 'Learning Buddy' : 'No Buddy'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {hasBuddy ? (
                <>
                  {buddyName}
                  {buddyHasLearnedToday && <span className="ml-1 text-green-600">• Active</span>}
                </>
              ) : (
                'Find a learning partner'
              )}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

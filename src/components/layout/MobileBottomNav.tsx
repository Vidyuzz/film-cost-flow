import { NavLink, useLocation } from 'react-router-dom'
import { Home, FolderOpen, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: FolderOpen, label: 'Projects', path: '/projects' },
  { icon: Plus, label: 'Create', path: '/projects/new' },
  { icon: User, label: 'Profile', path: '/profile' }
]

export const MobileBottomNav = () => {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path === '/projects' && location.pathname.startsWith('/projects') && location.pathname !== '/projects/new')
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-h-[60px] min-w-[60px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-none">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
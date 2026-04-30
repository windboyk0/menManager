import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Users, Briefcase, Link2, Star, Key } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

const navItems = [
  { label: '프로젝트', to: '/projects', icon: Briefcase },
  { label: '직원', to: '/employees', icon: Users },
  { label: '인력배치', to: '/assignments', icon: Link2 },
  { label: '스킬', to: '/skills', icon: Star },
  { label: 'MCP Key', to: '/mypage/apikey', icon: Key },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span
            className="text-lg font-bold cursor-pointer select-none"
            onClick={() => navigate('/projects')}
          >
            인력 관리 시스템
          </span>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.username} ({user.role})
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  )
}

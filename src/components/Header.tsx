import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { LayoutDashboard, Users2, FileBarChart, Bell, Settings, LogOut, LogIn, ClipboardList, Printer } from 'lucide-react'
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from './ui/navigation-menu'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Logo } from './Logo'

interface User {
  role: string
}

export function Header() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [notifications, setNotifications] = useState(2)

  useEffect(() => {
    const checkStatus = () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          // Check both role and email for admin access
          setIsAdmin(payload?.role === 'ADMIN' || payload?.email === 'admin@admin.com')
          setIsLoggedIn(true)
        } catch (error) {
          console.error('Error decoding token:', error)
          setIsAdmin(false)
          setIsLoggedIn(false)
        }
      } else {
        setIsAdmin(false)
        setIsLoggedIn(false)
      }
    }

    checkStatus()
    window.addEventListener('storage', checkStatus)
    
    return () => {
      window.removeEventListener('storage', checkStatus)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleSettings = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload?.role === 'ADMIN' || payload?.email === 'admin@admin.com') {
        router.push('/settings')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error accessing settings:', error)
      router.push('/login')
    }
  }

  return (
    <TooltipProvider>
      <div className="border-b bg-white/75 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center px-4">
          <Logo />
          
          <NavigationMenu className="ml-8">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <Button 
                  variant={router.pathname === '/' ? 'default' : 'ghost'} 
                  className="gap-2" 
                  asChild
                >
                  <NavigationMenuLink className="cursor-pointer" onClick={() => router.push('/')}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavigationMenuLink>
                </Button>
              </NavigationMenuItem>

              {!isLoggedIn && (
                <NavigationMenuItem>
                  <Button 
                    variant="ghost"
                    className="gap-2" 
                    onClick={() => router.push('/login')}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-auto flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center"
                      variant="destructive"
                    >
                      {notifications}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{notifications} new notifications</p>
              </TooltipContent>
            </Tooltip>

            {isAdmin && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={router.pathname === '/responses' ? 'default' : 'outline'} 
                      size="icon" 
                      onClick={() => router.push('/responses')}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Responses</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={router.pathname === '/print-report' ? 'default' : 'outline'} 
                      size="icon" 
                      onClick={() => router.push('/print-report')}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Print Evaluation Report</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={router.pathname === '/settings' ? 'default' : 'outline'} 
                      size="icon" 
                      onClick={handleSettings}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Radio,
  GitCompare,
  Newspaper,
  FileText,
  Settings,
  Search,
  Users,
  Tags,
  Library,
} from 'lucide-react'

const navItems = [
  {
    title: '首页',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: '内容源',
    href: '/channels',
    icon: Radio,
  },
  {
    title: '内容库',
    href: '/contents',
    icon: Library,
  },
  {
    title: '标签系统',
    href: '/tags',
    icon: Tags,
  },
  {
    title: '人物图谱',
    href: '/persons',
    icon: Users,
  },
  {
    title: '交叉分析',
    href: '/compare',
    icon: GitCompare,
  },
  {
    title: '日报',
    href: '/reports',
    icon: Newspaper,
  },
  {
    title: '深度报告',
    href: '/deep-reports',
    icon: FileText,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="h-12 border-b border-border px-4">
        <Link href="/" className="flex h-full items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-foreground">
            <span className="font-serif text-sm font-bold">I</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-serif text-sm font-semibold leading-tight tracking-tight">Insight Hub</span>
            <span className="text-[8px] uppercase leading-tight tracking-widest text-muted-foreground">内容智能分析</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* 搜索按钮 */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="mb-2 border border-dashed border-border hover:border-foreground"
                >
                  <button
                    onClick={() => {
                      const event = new KeyboardEvent('keydown', {
                        key: 'k',
                        metaKey: true,
                        bubbles: true,
                      })
                      document.dispatchEvent(event)
                    }}
                    className="w-full"
                  >
                    <Search className="h-4 w-4" />
                    <span className="flex-1 text-left text-muted-foreground">搜索...</span>
                    <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarSeparator className="my-2" />

              {/* 导航项 */}
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={isActive ? 'bg-foreground text-background hover:bg-foreground hover:text-background' : ''}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>设置</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

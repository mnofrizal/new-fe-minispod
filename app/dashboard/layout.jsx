"use client"

import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { 
  LayoutDashboard,
  Smartphone,
  Grid3X3,
  CreditCard,
  Settings,
  ChevronDown,
  LogOut,
  User,
  ChevronRight,
  Users,
  Package,
  CreditCard as SubscriptionIcon,
  Shield,
  Server,
  HardDrive,
  Rocket,
  Box,
  Globe2,
  Network
} from "lucide-react"

const menuItems = {
  platform: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Apps",
      url: "/dashboard/my-apps",
      icon: Smartphone,
    },
  ],
  explore: [
    {
      title: "Applications List",
      url: "/dashboard/applications",
      icon: Grid3X3,
    },
  ],
  admin: [
    {
      title: "Manage Users",
      url: "/dashboard/admin/users",
      icon: Users,
    },
    {
      title: "Manage Service Catalog",
      url: "/dashboard/admin/services",
      icon: Package,
    },
    {
      title: "Manage Subscriptions",
      url: "/dashboard/admin/subscriptions",
      icon: SubscriptionIcon,
    },
  ],
  server: [
    {
      title: "Nodes",
      url: "/dashboard/server/nodes",
      icon: HardDrive,
    },
    {
      title: "Deployment",
      url: "/dashboard/server/deployment",
      icon: Rocket,
    },
    {
      title: "Pods",
      url: "/dashboard/server/pods",
      icon: Box,
    },
    {
      title: "Namespaces",
      url: "/dashboard/server/namespaces",
      icon: Globe2,
    },
    {
      title: "Network",
      url: "/dashboard/server/network",
      icon: Network,
    },
  ],
  support: [
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: "Setting",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
}

function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (url) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(url)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Grid3X3 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Minispod</span>
            <span className="truncate text-xs">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.platform.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.explore.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.admin.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Server</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.server.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.support.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={session?.user?.avatar || "/placeholder-avatar.jpg"} alt={session?.user?.name || "User"} />
                    <AvatarFallback className="rounded-lg">
                      {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{session?.user?.name || "User"}</span>
                    <span className="truncate text-xs">{session?.user?.email || ""}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}

function DashboardBreadcrumb() {
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    // Define breadcrumb mappings
    const breadcrumbMap = {
      '/dashboard': [{ label: 'Dashboard', href: '/dashboard' }],
      '/dashboard/my-apps': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'My Apps', href: '/dashboard/my-apps' }
      ],
      '/dashboard/applications': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Applications List', href: '/dashboard/applications' }
      ],
      '/dashboard/billing': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Billing', href: '/dashboard/billing' }
      ],
      '/dashboard/settings': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/dashboard/settings' }
      ],
      '/dashboard/admin/users': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '#' },
        { label: 'Manage Users', href: '/dashboard/admin/users' }
      ],
      '/dashboard/admin/services': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '#' },
        { label: 'Manage Service Catalog', href: '/dashboard/admin/services' }
      ],
      '/dashboard/admin/subscriptions': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '#' },
        { label: 'Manage Subscriptions', href: '/dashboard/admin/subscriptions' }
      ],
      '/dashboard/server/nodes': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Server', href: '#' },
        { label: 'Nodes', href: '/dashboard/server/nodes' }
      ],
      '/dashboard/server/deployment': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Server', href: '#' },
        { label: 'Deployment', href: '/dashboard/server/deployment' }
      ],
      '/dashboard/server/pods': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Server', href: '#' },
        { label: 'Pods', href: '/dashboard/server/pods' }
      ],
      '/dashboard/server/namespaces': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Server', href: '#' },
        { label: 'Namespaces', href: '/dashboard/server/namespaces' }
      ],
      '/dashboard/server/network': [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Server', href: '#' },
        { label: 'Network', href: '/dashboard/server/network' }
      ]
    }

    return breadcrumbMap[pathname] || [{ label: 'Dashboard', href: '/dashboard' }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col" style={{ height: '98vh' }}>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 flex-1">
            <DashboardBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
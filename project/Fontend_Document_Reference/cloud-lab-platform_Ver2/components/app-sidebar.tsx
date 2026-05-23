'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Code2,
  Terminal,
  Settings,
  Cloud,
  User,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const mainNavItems = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

const learningNavItems = [
  {
    title: 'My Labs',
    href: '/labs',
    icon: FlaskConical,
  },
  {
    title: 'Attempts',
    href: '/submissions',
    icon: FileText,
  },
];

const practiceNavItems = [
  {
    title: 'Code Editor',
    href: '/workspace',
    icon: Code2,
  },
  {
    title: 'Terminal',
    href: '/terminal',
    icon: Terminal,
  },
];

const systemNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.6_0.22_290)]">
            <Cloud className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            Cloud Lab
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="mx-4" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Learning
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learningNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Practice
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {practiceNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
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
        <SidebarSeparator className="mx-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-default">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">Student</span>
                <span className="text-xs text-muted-foreground">v2.0.0</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

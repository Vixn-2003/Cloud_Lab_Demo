'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/src/i18n/navigation';
import {
  Home,
  BookOpen,
  History,
  Code2,
  Terminal,
  Settings,
  User,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  LogOut,
  Calendar,
  Activity,
  FileText,
  Shield,
  FileCheck,
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
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuthStore } from '@/lib/auth-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function AppSidebar() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    toast.success(t('logoutSuccess') || 'Đăng xuất thành công.');
    router.replace('/login');
  };

  const mainNavItems = [
    {
      title: t('home'),
      href: '/dashboard',
      icon: Home,
    },
  ];

  const learningNavItems = [
    {
      title: t('subjects'),
      href: '/subjects',
      icon: GraduationCap,
    },
    {
      title: t('myLabs'),
      href: '/labs',
      icon: BookOpen,
    },
    {
      title: t('myAttempts'),
      href: '/submissions',
      icon: History,
    },
    {
      title: t('feedback'),
      href: '/feedback',
      icon: MessageSquare,
    },
  ];

  const instructorNavItems = [
    {
      title: t('sessions'),
      href: '/sessions',
      icon: Calendar,
    },
    {
      title: t('monitoring'),
      href: '/monitoring',
      icon: Activity,
    },
    {
      title: t('grading'),
      href: '/grading',
      icon: FileText,
    },
    {
      title: t('plagiarism'),
      href: '/plagiarism',
      icon: Shield,
    },
  ];

  const practiceNavItems = [
    {
      title: t('sandbox'),
      href: '/workspace',
      icon: Code2,
    },
    {
      title: t('terminal'),
      href: '/terminal',
      icon: Terminal,
    },
  ];

  const helpNavItems = [
    {
      title: t('helpCenter'),
      href: '/help',
      icon: HelpCircle,
    },
    {
      title: t('settings'),
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.6_0.22_290)]">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
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

        {user?.role === 'student' ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('myLearning')}
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
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('instructorPanel')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {instructorNavItems.map((item) => (
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
        )}

        {user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              Quản trị hệ thống
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/approvals')}
                    tooltip={t('approvals')}
                  >
                    <Link href="/approvals">
                      <FileCheck className="h-4 w-4" />
                      <span>{t('approvals')}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {process.env.NODE_ENV === 'development' && user?.role === 'student' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('practiceArea')}
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
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {t('support')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {helpNavItems.map((item) => (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold uppercase text-xs">
                      {user?.username?.substring(0, 2) || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-white">
                      {user?.fullName || 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.role ? tCommon(user.role) : ''}
                    </span>
                  </div>
                  <User className="ml-auto size-4 group-data-[collapsible=icon]:hidden text-slate-500" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-slate-950 border-slate-800"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold uppercase text-xs">
                        {user?.username?.substring(0, 2) || 'US'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-white">
                        {user?.fullName}
                      </span>
                      <span className="truncate text-xs text-slate-400">
                        {user?.email || `@${user?.username}`}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <div className="px-2 py-1.5 group-data-[collapsible=icon]:block hidden space-y-2">
                  <div className="flex justify-center">
                    <LanguageSwitcher />
                  </div>
                  <div className="flex justify-center">
                    <ThemeSwitcher />
                  </div>
                </div>
                <div className="px-2 py-1.5 group-data-[collapsible=icon]:hidden space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{tCommon('language') || 'Ngôn ngữ'}</span>
                    <LanguageSwitcher />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{tCommon('theme') || 'Giao diện'}</span>
                    <ThemeSwitcher />
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-400 cursor-pointer gap-2"
                >
                  <LogOut className="size-4" />
                  {tCommon('logout') || 'Đăng xuất'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

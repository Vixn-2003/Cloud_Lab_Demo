'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/src/i18n/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { loginCode } from '@/lib/api'; // Wait, let's just make the direct API fetch inside login or write it in api.ts. Let's look at api.ts - we did not define login API in api.ts yet!
import {
  User as UserIcon,
  Lock,
  LogIn,
  GraduationCap,
  Briefcase,
  Shield,
  Chrome,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('fillAllFields'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('invalidCredentials'));
      }

      loginStore(data.token, data.user);
      toast.success(t('loginSuccess'), {
        description: `${t('welcomeBack')}, ${data.user.fullName}!`,
      });
      
      router.replace('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('serverError'));
      toast.error(t('loginFailed'), {
        description: err.message || t('serverError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFill = (role: 'student' | 'instructor' | 'admin') => {
    if (role === 'student') {
      setUsername('student');
      setPassword('student123');
    } else if (role === 'instructor') {
      setUsername('instructor');
      setPassword('instructor123');
    } else if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    }
    setError(null);
    toast.info(t('filledAccount', { role: t(role) }));
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background overflow-hidden">
      {/* Background Cyber Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-[oklch(0.6_0.22_290)]/10 dark:bg-[oklch(0.6_0.22_290)]/15 rounded-full blur-3xl mix-blend-screen animate-pulse pointer-events-none" />

      {/* Cyber grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo and Brand Title */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.6_0.22_290)] mb-3 shadow-lg shadow-primary/20">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            PTIT CLOUD LAB
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('brandSubtitle')}
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-card/40 dark:bg-black/40 border-border dark:border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Cyber Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-[oklch(0.6_0.22_290)] to-cyan-500" />
          
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center text-foreground">{t('loginTitle')}</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {t('loginSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{tCommon('error')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">{t('username')}</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="student / instructor / admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 bg-background/50 border-input text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all duration-200"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">{t('password')}</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 bg-background/50 border-input text-foreground placeholder-muted-foreground focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all duration-200"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-[oklch(0.6_0.22_290)] text-white hover:opacity-90 font-medium py-5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2 mt-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {isLoading ? t('submitting') : t('submit')}
              </Button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                {t('orDemoWith')}
              </span>
            </div>

            {/* Quick Credentials Panel */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAutoFill('student')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/40 hover:bg-muted/60 border border-border hover:border-primary/40 transition-all duration-200 group text-foreground cursor-pointer"
              >
                <GraduationCap className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">{t('student')}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">student</span>
              </button>
              <button
                onClick={() => handleAutoFill('instructor')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/40 hover:bg-muted/60 border border-border hover:border-primary/40 transition-all duration-200 group text-foreground cursor-pointer"
              >
                <Briefcase className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">{t('instructor')}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">instructor</span>
              </button>
              <button
                onClick={() => handleAutoFill('admin')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/40 hover:bg-muted/60 border border-border hover:border-primary/40 transition-all duration-200 group text-foreground cursor-pointer"
              >
                <Shield className="h-5 w-5 text-amber-500 dark:text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">{t('admin')}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">admin</span>
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pb-6">
            <Button
              variant="outline"
              onClick={() => toast.info(t('ssoConfigRequired'))}
              className="w-full border-border hover:bg-muted/60 hover:text-foreground bg-background/30 text-foreground font-normal transition-all duration-200 gap-2 cursor-pointer"
            >
              <Chrome className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              {t('ssoLogin')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

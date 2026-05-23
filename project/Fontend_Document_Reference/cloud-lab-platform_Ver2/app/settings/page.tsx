'use client';

import { toast } from 'sonner';
import { Code2, Terminal, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const {
    editorSettings,
    setEditorSettings,
    terminalSettings,
    setTerminalSettings,
  } = useAppStore();

  return (
    <div className="animate-fade-in-up p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your Cloud Lab experience
        </p>
      </div>

      {/* Editor Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <CardTitle>Editor</CardTitle>
          </div>
          <CardDescription>
            Configure the code editor appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Font Size</Label>
              <span className="text-sm text-muted-foreground">
                {editorSettings.fontSize}px
              </span>
            </div>
            <Slider
              value={[editorSettings.fontSize]}
              onValueChange={([value]) => {
                setEditorSettings({ fontSize: value });
                toast.success(`Font size set to ${value}px`);
              }}
              min={10}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tab Size</Label>
              <span className="text-sm text-muted-foreground">
                {editorSettings.tabSize} spaces
              </span>
            </div>
            <Slider
              value={[editorSettings.tabSize]}
              onValueChange={([value]) => {
                setEditorSettings({ tabSize: value });
                toast.success(`Tab size set to ${value} spaces`);
              }}
              min={2}
              max={8}
              step={2}
              className="w-full"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Key Bindings</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred keyboard shortcuts
              </p>
            </div>
            <Select
              value={editorSettings.keyBindings}
              onValueChange={(value: 'default' | 'vim' | 'emacs') => {
                setEditorSettings({ keyBindings: value });
                toast.success(`Key bindings set to ${value}`);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="vim">Vim</SelectItem>
                <SelectItem value="emacs">Emacs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Terminal Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle>Terminal</CardTitle>
          </div>
          <CardDescription>
            Configure the interactive terminal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Font Size</Label>
              <span className="text-sm text-muted-foreground">
                {terminalSettings.fontSize}px
              </span>
            </div>
            <Slider
              value={[terminalSettings.fontSize]}
              onValueChange={([value]) => {
                setTerminalSettings({ fontSize: value });
                toast.success(`Terminal font size set to ${value}px`);
              }}
              min={10}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Cursor Style</Label>
              <p className="text-sm text-muted-foreground">
                Choose the cursor appearance
              </p>
            </div>
            <Select
              value={terminalSettings.cursorStyle}
              onValueChange={(value: 'block' | 'underline' | 'bar') => {
                setTerminalSettings({ cursorStyle: value });
                toast.success(`Cursor style set to ${value}`);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="underline">Underline</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Scrollback Buffer</Label>
              <span className="text-sm text-muted-foreground">
                {terminalSettings.scrollback} lines
              </span>
            </div>
            <Slider
              value={[terminalSettings.scrollback]}
              onValueChange={([value]) => {
                setTerminalSettings({ scrollback: value });
                toast.success(`Scrollback set to ${value} lines`);
              }}
              min={100}
              max={10000}
              step={100}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>About</CardTitle>
          </div>
          <CardDescription>
            System information and version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">2.0.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Framework</p>
              <p className="font-medium">Next.js 15</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">UI Library</p>
              <p className="font-medium">shadcn/ui + Radix</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Code Editor</p>
              <p className="font-medium">Monaco Editor</p>
            </div>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground">
            <p>
              Cloud Lab is an enterprise-grade online lab platform for academic
              excellence. Built with modern web technologies for the best
              learning experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

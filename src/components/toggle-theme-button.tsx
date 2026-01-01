'use client';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';
import { type ThemeColor, useThemeStore } from '~/stores/theme-store';

function ToggleThemeButton() {
  const { theme, setTheme } = useTheme();
  const { color, setColor } = useThemeStore();

  // Ensure component is mounted to avoid hydration mismatch on icon rendering
  const [_mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const colors: { name: ThemeColor; class: string }[] = [
    { name: 'zinc', class: 'bg-zinc-950 dark:bg-zinc-100' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'violet', class: 'bg-violet-500' },
    { name: 'yellow', class: 'bg-yellow-500' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative ring-1 ring-primary"
        >
          <Sun className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px]">
        <div className="p-2">
          <DropdownMenuLabel className="px-0.5 font-semibold text-muted-foreground text-xs uppercase">
            Mode
          </DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme('light')}
              className={cn(
                'justify-start gap-2',
                theme === 'light' && 'border-primary bg-accent'
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme('dark')}
              className={cn(
                'justify-start gap-2',
                theme === 'dark' && 'border-primary bg-accent'
              )}
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme('system')}
              className={cn(
                'justify-start gap-2',
                theme === 'system' && 'border-primary bg-accent'
              )}
            >
              <Monitor className="h-4 w-4" />
              System
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="p-2">
          <DropdownMenuLabel className="px-0.5 font-semibold text-muted-foreground text-xs uppercase">
            Color
          </DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((t) => (
              <Button
                key={t.name}
                variant="outline"
                className={cn(
                  'h-8 w-full justify-start gap-2 px-2',
                  color === t.name && 'border-transparent ring-1 ring-primary'
                )}
                onClick={() => setColor(t.name)}
              >
                <span
                  className={cn('h-4 w-4 shrink-0 rounded-full', t.class)}
                />
                <span className="text-xs capitalize">{t.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ToggleThemeButton;

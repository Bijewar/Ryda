"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Theme toggle — CSS-driven icon (no mounted state). Light is the default
 * for Ryda v2; the toggle still allows users to flip to dark for
 * accessibility.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();

  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
      className="h-9 w-9 text-ryda-muted hover:text-ryda-text hover:bg-ryda-bg-soft"
      onClick={toggle}
    >
      {/* Sun shows in dark mode (click to go light); Moon shows in light mode. */}
      <Sun className="size-4 hidden dark:block" aria-hidden="true" />
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
      <span className="sr-only">Toggle colour theme</span>
    </Button>
  );
}

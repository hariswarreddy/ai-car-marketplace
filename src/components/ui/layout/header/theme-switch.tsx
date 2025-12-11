"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeSwitch = () => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure the theme state is ready before rendering icons
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Don't render icons during SSR — prevents hydration mismatch
    return (
      <button className="flex items-center justify-center w-10 h-10 rounded-full opacity-0 pointer-events-none">
        <SunIcon />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted"
    >
      <span suppressHydrationWarning>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
};


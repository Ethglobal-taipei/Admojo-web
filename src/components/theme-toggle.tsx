"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore } from "@/lib/store"
import { useEffect } from "react"

export function ThemeToggle() {
  // Get theme state and actions from the UI store
  const { theme, setTheme } = useUIStore()

  // Toggle between light and dark mode
  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

      if (systemTheme === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    } else {
      if (theme === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }, [theme])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}


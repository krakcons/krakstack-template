import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { m } from "@/paraglide/messages";

type Theme = "light" | "dark" | "system";

const storageKey = "theme";

const themes = ["light", "dark", "system"] as const satisfies Theme[];

const themeLabel = (theme: Theme) => {
  switch (theme) {
    case "light":
      return m.theme_light();
    case "dark":
      return m.theme_dark();
    case "system":
      return m.theme_system();
  }
};

const storedTheme = (): Theme => {
  const value = localStorage.getItem(storageKey);
  return themes.find((theme) => theme === value) ?? "system";
};

const applyTheme = (theme: Theme) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle(
    "dark",
    theme === "dark" || (theme === "system" && prefersDark),
  );
};

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const selectedTheme = storedTheme();
    setTheme(selectedTheme);
    applyTheme(selectedTheme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (storedTheme() === "system") applyTheme("system");
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const onValueChange = (value: string) => {
    const nextTheme =
      themes.find((candidate) => candidate === value) ?? "system";
    localStorage.setItem(storageKey, nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={m.theme_switcher_label()}
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
            <span className="sr-only">{m.theme_switcher_label()}</span>
          </Button>
        }
      />
      <DropdownMenuContent className="w-32" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.theme_switcher_label()}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={onValueChange}>
            {themes.map((candidate) => (
              <DropdownMenuRadioItem key={candidate} value={candidate}>
                {themeLabel(candidate)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

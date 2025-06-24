
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-full justify-start"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 mr-3" />
      ) : (
        <Moon className="h-4 w-4 mr-3" />
      )}
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </Button>
  );
};

export default DarkModeToggle;

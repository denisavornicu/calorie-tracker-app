import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" className="topbar-icon-button" onClick={toggleTheme}>
      {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
    </button>
  );
};

export default ThemeToggle;
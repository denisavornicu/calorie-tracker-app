import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [colorMode, setColorMode] = useState(() => {
    return localStorage.getItem("colorMode") || "light";
  });

  const [themeStyle, setThemeStyle] = useState(() => {
    return localStorage.getItem("themeStyle") || "pink-purple";
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorMode);
    localStorage.setItem("colorMode", colorMode);
  }, [colorMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme-style", themeStyle);
    localStorage.setItem("themeStyle", themeStyle);
  }, [themeStyle]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-sidebar-collapsed",
      sidebarCollapsed ? "true" : "false"
    );

    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleTheme = () => {
    setColorMode((currentMode) => (currentMode === "light" ? "dark" : "light"));
  };

  const changeThemeStyle = (style) => {
    setThemeStyle(style);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((currentValue) => !currentValue);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: colorMode,
        colorMode,
        themeStyle,
        sidebarCollapsed,
        toggleTheme,
        changeThemeStyle,
        toggleSidebar,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
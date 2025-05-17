import React, { createContext, useContext, useEffect, useState } from "react";
import { MermaidConfig } from "mermaid";
// Reference: https://code.visualstudio.com/api/references/theme-color

interface ThemeColors {
  background: string;
  foreground: string;
  buttonBackground: string;
  buttonForeground: string;
  buttonHoverBackground: string;
  errorBackground: string;
  errorForeground: string;
  successBackground: string;
  successForeground: string;
  notificationsBackground: string;
  notificationsForeground: string;
}

export type ExportMermaidThemeType = MermaidConfig["theme"] | "auto";

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  assetUrl: string;
  mermaidTheme: MermaidConfig["theme"];
  exportMermaidTheme: ExportMermaidThemeType;
}

const defaultTheme: ThemeColors = {
  background: "#ffffff",
  foreground: "#000000",
  buttonBackground: "#007acc",
  buttonForeground: "#ffffff",
  buttonHoverBackground: "#0062a3",
  errorBackground: "#f44336",
  errorForeground: "#ffffff",
  successBackground: "#4caf50",
  successForeground: "#ffffff",
  notificationsBackground: "#ffffff",
  notificationsForeground: "#000000",
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultTheme,
  isDark: false,
  assetUrl: "",
  mermaidTheme: "default",
  exportMermaidTheme: "default",
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colors, setColors] = useState<ThemeColors>(defaultTheme);
  const [isDark, setIsDark] = useState(false);
  const [assetUrl, setAssetUrl] = useState("");
  const [mermaidTheme, setMermaidTheme] = useState<MermaidConfig["theme"]>("default");
  const [exportMermaidTheme, setExportMermaidTheme] = useState<ExportMermaidThemeType>("default");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Set assetUrl from window
    if (window.assetUrl) {
      setAssetUrl(window.assetUrl);
    }

    // Function to update theme based on VSCode theme
    const updateTheme = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      const newColors: ThemeColors = {
        background:
          computedStyle.getPropertyValue("--vscode-editor-background").trim() ||
          defaultTheme.background,
        foreground:
          computedStyle.getPropertyValue("--vscode-editor-foreground").trim() ||
          defaultTheme.foreground,
        buttonBackground:
          computedStyle.getPropertyValue("--vscode-button-background").trim() ||
          defaultTheme.buttonBackground,
        buttonForeground:
          computedStyle.getPropertyValue("--vscode-button-foreground").trim() ||
          defaultTheme.buttonForeground,
        buttonHoverBackground:
          computedStyle.getPropertyValue("--vscode-button-hoverBackground").trim() ||
          defaultTheme.buttonHoverBackground,
        errorBackground:
          computedStyle.getPropertyValue("--vscode-errorForeground").trim() ||
          defaultTheme.errorBackground,
        errorForeground:
          computedStyle.getPropertyValue("--vscode-errorBackground").trim() ||
          defaultTheme.errorForeground,
        successBackground:
          computedStyle.getPropertyValue("--vscode-terminal-ansiGreen").trim() ||
          defaultTheme.successBackground,
        successForeground:
          computedStyle.getPropertyValue("--vscode-editor-foreground").trim() ||
          defaultTheme.successForeground,
        notificationsBackground:
          computedStyle.getPropertyValue("--vscode-notifications-background").trim() ||
          defaultTheme.notificationsBackground,
        notificationsForeground:
          computedStyle.getPropertyValue("--vscode-notifications-foreground").trim() ||
          defaultTheme.notificationsForeground,
      };

      const bgColor = newColors.background.toLowerCase();
      const isDarkTheme = bgColor.startsWith("#")
        ? parseInt(bgColor.slice(1), 16) < 0x808080
        : bgColor.includes("dark");

      setColors(newColors);
      setIsDark(isDarkTheme);

      // Update Mermaid theme
      const mermaidTheme = isDarkTheme ? "dark" : "default";
      setMermaidTheme(mermaidTheme);
      setExportMermaidTheme((window as any).exportMermaidTheme || mermaidTheme);
    };

    updateTheme();

    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    setIsInitialized(true);

    return () => observer.disconnect();
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, isDark, assetUrl, mermaidTheme, exportMermaidTheme }}>
      {isInitialized && children}
    </ThemeContext.Provider>
  );
};

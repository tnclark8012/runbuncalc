/**
 * Initialize the ThemeToggle component
 */

import { FluentProvider, Theme, webLightTheme } from '@fluentui/react-components';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ThemeToggle } from './ThemeToggle';

let themeToggleRoot: Root | null = null;

/**
 * Wrapper component for ThemeToggle with theme state management
 */
const ThemeToggleWrapper: React.FC = () => {
  // Check for saved theme preference in localStorage
  const savedTheme = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
  const initialMode = savedTheme || 'light';

  // State to manage theme
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(webLightTheme);

  return (
    <FluentProvider theme={currentTheme}>
      <ThemeToggle 
        initialMode={initialMode}
        onThemeChange={(isDark) => {
          // Save theme preference to localStorage
          localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
        }}
        onThemeReady={(theme) => {
          setCurrentTheme(theme);
        }}
      />
    </FluentProvider>
  );
};

/**
 * Initialize the theme toggle component
 */
export function initializeThemeToggle(): void {
  const container = document.getElementById('theme-toggle');

  if (container) {
    if (!themeToggleRoot) {
      themeToggleRoot = createRoot(container);
    }
    
    themeToggleRoot.render(<ThemeToggleWrapper />);
  }
}

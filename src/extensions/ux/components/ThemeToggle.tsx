import { BrandVariants, createDarkTheme, createLightTheme, Switch, Theme } from '@fluentui/react-components';
import * as React from 'react';

/**
 * Leaf Green brand variants for Fluent UI v9
 */
const leafGreenBrand: BrandVariants = {
  10: '#f1f8f4',
  20: '#c8e6c9',
  30: '#a5d6a7',
  40: '#81c784',
  50: '#66bb6a',
  60: '#4CAF50',
  70: '#43a047',
  80: '#388e3c',
  90: '#2e7d32',
  100: '#1b5e20',
  110: '#0d2f10',
  120: '#051508',
  130: '#021902',
  140: '#010d01',
  150: '#000500',
  160: '#000200',
};

/**
 * Create custom Leaf Green themes
 */
const lightTheme: Theme = {
  ...createLightTheme(leafGreenBrand),
};

const darkTheme: Theme = {
  ...createDarkTheme(leafGreenBrand),
};

export interface ThemeToggleProps {
  /**
   * Initial theme mode. Defaults to 'light'.
   */
  initialMode?: 'light' | 'dark';
  /**
   * Callback when theme changes
   */
  onThemeChange?: (isDark: boolean) => void;
  /**
   * Callback to get current theme for FluentProvider
   */
  onThemeReady?: (theme: Theme) => void;
}

/**
 * ThemeToggle component - provides a toggle switch to change between light and dark themes
 * For Fluent UI v9
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  initialMode = 'light',
  onThemeChange,
  onThemeReady,
}) => {
  const [isDark, setIsDark] = React.useState(initialMode === 'dark');
  
  // Get current theme
  const currentTheme = isDark ? darkTheme : lightTheme;

  // Apply theme on mount and when it changes
  React.useEffect(() => {
    // Set data-theme attribute on :root for CSS variables
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    onThemeChange?.(isDark);
    onThemeReady?.(currentTheme);
  }, [isDark, currentTheme, onThemeChange, onThemeReady]);

  const handleToggle = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    setIsDark(ev.currentTarget.checked);
  }, []);

  return (
    <Switch
      label="Dark Mode"
      checked={isDark}
      onChange={handleToggle}
    />
  );
};

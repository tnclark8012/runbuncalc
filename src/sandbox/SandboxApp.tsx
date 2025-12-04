/**
 * Root Sandbox App component that provides a single FluentProvider for the entire page
 */

import { FluentProvider, Theme, webLightTheme } from '@fluentui/react-components';
import * as React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { initializeDeveloperTools } from '../extensions/ux/components/developer-tools-usage';
import { CpuSetSelector, PlayerSetSelector } from '../extensions/ux/components/set-selector-usage';
import { ThemeToggle } from '../extensions/ux/components/ThemeToggle';
import { persistor, store } from '../extensions/ux/store/store';

/**
 * Root application component that wraps all sandbox components with a single FluentProvider
 */
export const SandboxApp: React.FC = () => {
  // Check for saved theme preference in localStorage
  const savedTheme = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
  const initialMode = savedTheme || 'light';

  // State to manage theme for the entire app
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(webLightTheme);

  // Initialize developer tools on mount
  React.useEffect(() => {
    initializeDeveloperTools();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <FluentProvider theme={currentTheme}>
          <div className="theme-toggle-container">
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
          </div>
          <h1>React Component Sandbox</h1>
          <div className="set-selectors">
            <div className="set-selector-container">
              <PlayerSetSelector />
            </div>
            <div className="set-selector-container">
              <CpuSetSelector />
            </div>
          </div>
          <div className="move-result-groups">
            <div className="move-result-subgroup" aria-labelledby="resultHeaderL"></div>
            <div className="move-result-subgroup" aria-labelledby="resultHeaderR"></div>
          </div>
        </FluentProvider>
      </PersistGate>
    </Provider>
  );
};

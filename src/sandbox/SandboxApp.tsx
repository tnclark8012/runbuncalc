/**
 * Root Sandbox App component that provides a single FluentProvider for the entire page
 */

import { FluentProvider, Theme, webLightTheme } from '@fluentui/react-components';
import * as React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { getActiveCollection } from '../extensions/core/storage';
import { CaptureBattleState } from '../extensions/ux/components/CaptureBattleState';
import { initializeDeveloperTools } from '../extensions/ux/components/developer-tools-usage';
import { FieldStateControl } from '../extensions/ux/components/FieldStateControl';
import { CpuMoves } from '../extensions/ux/components/move-results/CpuMoves';
import { PlayerMoves } from '../extensions/ux/components/move-results/PlayerMoves';
import { CpuPokemonSetDetails, PlayerPokemonSetDetails } from '../extensions/ux/components/pokemon-set-details/pokemon-set-details-usage';
import { CpuSetSelector, PlayerSetSelector } from '../extensions/ux/components/pokemon-set-selection/set-selector-usage';
import { ThemeToggle } from '../extensions/ux/components/ThemeToggle';
import { CpuPartyManager, PlayerBoxManager, PlayerPartyManager } from '../extensions/ux/components/trainer-management/trainer-management-usage';
import { useAppSelector } from '../extensions/ux/store/hooks';
import { persistor, store } from '../extensions/ux/store/store';
import { initializeSandbox } from './initializeSandbox';

// Combined terrain + weather backgrounds (prioritized)
const COMBINED_BACKGROUNDS: Record<string, string> = {
  'Electric-Sun': 'url(./extensions/ux/svgs/electric-terrain-sun.svg)',
  'Electric-Rain': 'url(./extensions/ux/svgs/electric-terrain-rain.svg)',
  'Electric-Hail': 'url(./extensions/ux/svgs/electric-terrain-hail.svg)',
  'Electric-Sand': 'url(./extensions/ux/svgs/electric-terrain-sand.svg)',
  'Grassy-Sun': 'url(./extensions/ux/svgs/grassy-terrain-sun.svg)',
  'Grassy-Rain': 'url(./extensions/ux/svgs/grassy-terrain-rain.svg)',
  'Grassy-Hail': 'url(./extensions/ux/svgs/grassy-terrain-hail.svg)',
  'Grassy-Sand': 'url(./extensions/ux/svgs/grassy-terrain-sand.svg)',
  'Psychic-Sun': 'url(./extensions/ux/svgs/psychic-terrain-sun.svg)',
  'Psychic-Rain': 'url(./extensions/ux/svgs/psychic-terrain-rain.svg)',
  'Psychic-Hail': 'url(./extensions/ux/svgs/psychic-terrain-hail.svg)',
  'Psychic-Sand': 'url(./extensions/ux/svgs/psychic-terrain-sand.svg)',
  'Misty-Sun': 'url(./extensions/ux/svgs/misty-terrain-sun.svg)',
  'Misty-Rain': 'url(./extensions/ux/svgs/misty-terrain-rain.svg)',
  'Misty-Hail': 'url(./extensions/ux/svgs/misty-terrain-hail.svg)',
  'Misty-Sand': 'url(./extensions/ux/svgs/misty-terrain-sand.svg)',
};

// Weather-only backgrounds (when no terrain)
const WEATHER_BACKGROUNDS: Record<string, string> = {
  'Sun': 'url(./extensions/ux/svgs/weather-sun.svg)',
  'Rain': 'url(./extensions/ux/svgs/weather-rain.svg)',
  'Hail': 'url(./extensions/ux/svgs/weather-hail.svg)',
  'Sand': 'url(./extensions/ux/svgs/weather-sand.svg)',
};

// Terrain-only backgrounds (fallback)
const TERRAIN_BACKGROUNDS: Record<string, string> = {
  'Electric': 'url(./extensions/ux/svgs/electric-terrain.svg)',
  'Grassy': 'url(./extensions/ux/svgs/grassy-terrain.svg)',
  'Psychic': 'url(./extensions/ux/svgs/psychic-terrain.svg)',
  'Misty': 'url(./extensions/ux/svgs/misty-terrain.svg)',
};

/**
 * Inner component that can access Redux state for terrain-based background
 */
const SandboxContent: React.FC<{ 
  initialMode: 'light' | 'dark';
  onThemeChange: (isDark: boolean) => void;
  onThemeReady: (theme: Theme) => void;
}> = ({ initialMode, onThemeChange, onThemeReady }) => {
  const terrain = useAppSelector((state) => state.field.terrain);
  const weather = useAppSelector((state) => state.field.weather);

  // Determine background style based on terrain and weather
  const setSelectorsStyle = React.useMemo(() => {
    const baseStyle = {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };

    // Try combined terrain + weather first
    if (terrain && weather) {
      const combinedKey = `${terrain}-${weather}`;
      if (COMBINED_BACKGROUNDS[combinedKey]) {
        return {
          ...baseStyle,
          backgroundImage: COMBINED_BACKGROUNDS[combinedKey],
        };
      }
    }

    // If only weather is set, use weather-only background
    if (weather && WEATHER_BACKGROUNDS[weather]) {
      return {
        ...baseStyle,
        backgroundImage: WEATHER_BACKGROUNDS[weather],
      };
    }

    // If only terrain is set, use terrain-only background
    if (terrain && TERRAIN_BACKGROUNDS[terrain]) {
      return {
        ...baseStyle,
        backgroundImage: TERRAIN_BACKGROUNDS[terrain],
      };
    }
    
    return undefined;
  }, [terrain, weather]);

  return (
    <>
      <header className="sandbox-header">
        <h1>Run & Bun Calculator</h1>
        <div className="sandbox-toolbar">
          <FieldStateControl />
          <ThemeToggle
            initialMode={initialMode}
            onThemeChange={onThemeChange}
            onThemeReady={onThemeReady}
          />
        </div>
      </header>
      <div className="set-selectors" style={setSelectorsStyle}>
        <div className="set-selector-container">
          <PlayerMoves />
          <PlayerSetSelector />
          <PlayerPokemonSetDetails />
          <PlayerPartyManager />
          <PlayerBoxManager />
        </div>
        <div className="set-selector-container">
          <CpuMoves />
          <CpuSetSelector />
          <CpuPokemonSetDetails />
          <CpuPartyManager />
        </div>
      </div>
      <CaptureBattleState />
    </>
  );
};

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
      <PersistGate
        loading={null}
        persistor={persistor}
        onBeforeLift={() => store.dispatch(initializeSandbox(getActiveCollection()))}
      >
        <FluentProvider theme={currentTheme}>
          <main className="sandbox-app">
            <SandboxContent
              initialMode={initialMode}
              onThemeChange={(isDark) => {
                localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
              }}
              onThemeReady={(theme) => {
                setCurrentTheme(theme);
              }}
            />
          </main>
        </FluentProvider>
      </PersistGate>
    </Provider>
  );
};

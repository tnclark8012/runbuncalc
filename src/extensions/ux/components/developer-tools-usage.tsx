/**
 * Example: How to use the DeveloperTools component
 * 
 * This demonstrates the Redux + Local Storage integration with the MoveResultGroup component.
 */

import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DeveloperTools, MoveItem } from './index';

// Store root for potential cleanup/updates
let devToolsRoot: Root | null = null;

// Example data for the developer tools
const exampleMoves: MoveItem[] = [
  {
    id: 'resultMoveL1',
    name: 'Dazzling Gleam',
    damageRange: '259 - 306',
    damagePercent: '1126 - 1330.4%',
    position: 'top',
    defaultChecked: true,
  },
  {
    id: 'resultMoveL2',
    name: 'Stored Power',
    damageRange: '191 - 226',
    damagePercent: '191 - 226%',
    position: 'mid',
  },
  {
    id: 'resultMoveL3',
    name: 'Acid Armor',
    damageRange: '0 - 0',
    damagePercent: '0 - 0%',
    position: 'mid',
  },
  {
    id: 'resultMoveL4',
    name: 'Recover',
    damageRange: '0 - 0',
    damagePercent: '0 - 0%',
    position: 'bottom',
  },
];

/**
 * Initialize the DeveloperTools component
 * 
 * Call this function after the page loads to render the DeveloperTools
 * component which demonstrates Redux state management with local storage persistence.
 */
export function initializeDeveloperTools(): void {
  // Find the container for the developer tools
  const container = document.querySelector('.move-result-subgroup[aria-labelledby="resultHeaderL"]');

  if (container) {
    if (!devToolsRoot) {
      devToolsRoot = createRoot(container);
    }
    devToolsRoot.render(
      <DeveloperTools
        moves={exampleMoves}
        headerId="resultHeaderL"
        headerText="Developer Tools - Redux + Local Storage Demo"
        radioGroupName="devToolsMoves"
      />
    );
  }
}

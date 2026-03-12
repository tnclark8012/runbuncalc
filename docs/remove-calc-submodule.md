# Plan: Remove local calc/ and consume @smogon/calc from npm

Remove the embedded `calc/` folder and consume `@smogon/calc` as a standard npm dependency. Refactor deep imports to use the main entry point where possible, copy the test helper locally, and drop legacy HTML page support.

---

### Phase 1: Prepare the test helper (no dependency on calc/)

1. **Copy test helper locally** — Copy `calc/src/test/helper.ts` into a new `src/extensions/simulator/test-utils/calc-test-helper.ts`, adjusting internal imports to reference `@smogon/calc` instead of relative paths
2. **Update test imports** — 3 spec files import `importPokemon`/`importTeam` from `@smogon/calc/src/test/helper`. Point them at the new local copy:
   - `src/extensions/simulator/helper.spec.ts`
   - `src/extensions/simulator/battlefield-state.spec.ts`
   - `src/extensions/simulator/test-helper.spec.ts`
3. **Remove `@smogon/test/*` path alias** from root `tsconfig.json`

### Phase 2: Refactor deep imports to use main entry point

**Step 2.1 — `@smogon/calc/dist/data/interface` → `@smogon/calc`** (~13 files)
All types (`Generation`, `StatusName`, `TypeName`, `ItemName`, `MoveName`, `Terrain`, `Weather`, `StatID`) are available from the main entry via the `I` namespace or as direct exports. Consolidate imports from `@smogon/calc/dist/data/interface` and `@smogon/calc/src/data/interface` into `import { I } from '@smogon/calc'` or `import type { ... } from '@smogon/calc'`.

**Step 2.2 — `@smogon/calc/src` → `@smogon/calc`** (~7 files)
`Result`, `Side`, `StatsTable` are all re-exported from the main entry. Change `@smogon/calc/src` and `@smogon/calc/src/field` imports to `@smogon/calc`. *(parallel with 2.1)*

**Step 2.3 — Unavoidable deep imports** (keep as dist/ paths)
These are NOT re-exported from the main entry and must remain as deep imports:
- `PokemonOptions` from `@smogon/calc/dist/pokemon` (2 files)
- `getRecoil`, `getRecovery` from `@smogon/calc/dist/desc` (1 file)
- `getFinalSpeed`, `getModifiedStat` from `@smogon/calc/src/mechanics/util` → change to `@smogon/calc/dist/mechanics/util` (1 file)

### Phase 3: Switch to npm dependency

4. **Update `package.json`:**
   - `"@smogon/calc": "file:calc"` → `"@smogon/calc": "^0.7.0"`
   - Remove `subpkg` from devDependencies and `"subPackages"` config
   - Strip `subpkg run ...` prefixes from all scripts (`lint`, `fix`, `compile`, `bundle`, `build`, `testAll`, `postinstall`)

5. **Update `build.cjs`:**
   - Remove `npm --prefix calc/ run compile` line
   - Remove `cpdir('calc/dist', 'dist/calc')` line

6. **Remove calc script tags** from legacy HTML templates (dropping legacy page support per user decision):
   - `src/honkalculate.template.html` — remove `./calc/*.js` script tags
   - `src/index.template.html` — remove `./calc/*.js` script tags

7. **Clean up `tsconfig.json`:** Remove `"calc"` from `exclude` array

### Phase 4: Delete calc/ and install

8. **Delete the entire `calc/` directory**
9. **Run `npm install`** to fetch `@smogon/calc` from npm registry

### Phase 5: Verification

10. `npx tsc --noEmit` — verify all imports resolve
11. `npm test` — verify tests pass
12. `npm run build` — verify full build pipeline works
13. Manual check that webpack produces expected bundles

---

### Relevant Files
- **Modify:** `package.json`, `tsconfig.json`, `build.cjs`, `src/honkalculate.template.html`, `src/index.template.html`, ~20 source files with deep imports (detailed above), 3 spec files
- **Create:** `src/extensions/simulator/test-utils/calc-test-helper.ts`
- **Delete:** `calc/` (entire folder)

### Risks
- Deep imports into `@smogon/calc/dist/` (`PokemonOptions`, `getRecoil`, `getRecovery`, `getFinalSpeed`, `getModifiedStat`) depend on the published package's internal file structure — fragile across version updates. Consider upstreaming these exports.
- Verify npm `@smogon/calc@0.7.0` matches the local `calc/` code before deleting.

### Decisions
- Drop legacy HTML page support (index.html, honkalculate.html calc script tags)
- Copy test helper locally rather than relying on internal package paths
- Refactor deep imports to main entry where possible; keep only unavoidable dist/ deep imports

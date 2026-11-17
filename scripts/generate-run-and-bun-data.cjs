const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const lua = fs.readFileSync(path.join(root, 'src', 'runandbun_script_imports.lua'), 'utf8');
const tables = {
  SPECIES: 'mons',
  MOVES: 'move',
  ITEMS: 'item',
  NATURES: 'nature',
};
let output = '// Generated from src/runandbun_script_imports.lua by scripts/generate-run-and-bun-data.cjs.\n';
for (const [name, source] of Object.entries(tables)) {
  const match = new RegExp(`\\b${source}\\s*=\\s*\\{([\\s\\S]*?)\\}`).exec(lua);
  if (!match) throw new Error(`Missing Lua table: ${source}`);
  const text = match[1].replace(/--[^\r\n]*/g, '');
  const values = Array.from(text.matchAll(/(["'])(.*?)\1/g), value => value[2]);
  if (!values.length) throw new Error(`Empty Lua table: ${source}`);
  output += `\nexport const ${name}: readonly string[] = [\n`;
  for (let i = 0; i < values.length; i += 8) {
    output += `  ${values.slice(i, i + 8).map(value => JSON.stringify(value)).join(', ')},\n`;
  }
  output += '];\n';
}
fs.writeFileSync(path.join(root, 'src', 'exporter', 'run-and-bun', 'data.ts'), output);

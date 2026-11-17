# Offline Pokémon sprites: source and terms

Goal: bundle sprites for offline use instead of hot-linking `raw.githubusercontent.com/May8th1995/sprites/master/<name>.png`. Research checked 2026-11-17. No artwork was copied during research; the implementation downloads sprites during the producer build.

## Conclusion

Use **PokeAPI/sprites** at a pinned revision, with attribution to The Pokémon Company.

### The invitation to reuse

The PokeAPI/sprites README says:

> "To save load on PokéAPI, we host all the sprite images here. If you want to use all the sprites in your application, you can just download the entire contents directly."

Source: [README.md @ c0542f7](https://github.com/PokeAPI/sprites/blob/c0542f7c51215d9672439012838c99f520596cbd/README.md). It also documents `git clone` and `npm install --save github:PokeAPI/sprites`.

### Copyright caveat

`LICENCE.txt` says:

> "All image contents within are Copyright The Pokémon Company. This repository is distributed under CC0 1.0 Universal"

Source: [LICENCE.txt @ c0542f7](https://github.com/PokeAPI/sprites/blob/c0542f7c51215d9672439012838c99f520596cbd/LICENCE.txt).

- The artwork remains The Pokémon Company's copyright.
- CC0 describes the maintainers' own contributions to the repo. It does not transfer or relicense the artwork.
- Our basis for bundling is the maintainers' published invitation to use the sprites in applications, together with attribution.
- Keep a NOTICE giving the copyright and source repo.

## Pinned sources

| Purpose | Source |
| --- | --- |
| Images | `PokeAPI/sprites` @ `c0542f7c51215d9672439012838c99f520596cbd` (2026-11-13) |
| Name → id mapping | `PokeAPI/pokeapi` @ `8d8a49d9295bbc951d882004570ca496866fd9d8` (2026-11-17) |

## Paths and sizes

- Default sprite: `sprites/pokemon/<pokemon_id>.png`, 96×96 PNG. Verified for ids 25 and 10033.
- Raw URL: `https://raw.githubusercontent.com/PokeAPI/sprites/c0542f7c51215d9672439012838c99f520596cbd/sprites/pokemon/<pokemon_id>.png`
- Smaller icons, if wanted: `sprites/pokemon/versions/generation-vii/icons/<pokemon_id>.png`, 40×30, which matches the old May8th size.
- Gen 8 icons are under `generation-viii/sword-shield/icons/` (there is no `generation-viii/icons/`).

## Mapping

Files are in `PokeAPI/pokeapi` `data/v2/csv/` at the pinned revision.

- [`pokemon.csv`](https://github.com/PokeAPI/pokeapi/blob/8d8a49d9295bbc951d882004570ca496866fd9d8/data/v2/csv/pokemon.csv): header `id,identifier,species_id,height,weight,base_experience,order,is_default`.
  - `id` is the sprite filename.
  - Examples: `10001,deoxys-attack`, `10033,venusaur-mega`, `10091,rattata-alola`.
  - `identifier` is a lowercase slug, so runbuncalc names can be normalised and matched exactly.
- [`pokemon_forms.csv`](https://github.com/PokeAPI/pokeapi/blob/8d8a49d9295bbc951d882004570ca496866fd9d8/data/v2/csv/pokemon_forms.csv): header `id,identifier,form_identifier,pokemon_id,...`.
  - Use `pokemon_id`, not the form `id`: `10133,venusaur-mega,mega,10033` maps to `10033.png`.
  - Cosmetic forms (for example Unown, Burmy, Vivillon) have form ids but no separate default sprite.
  - The implementation documents default sprites for 45 such variants.
- Regional and battle forms that do not match by identifier need explicit overrides, which the implementation provides.

## Why not May8th1995/sprites

The repo (https://github.com/May8th1995/sprites) has no licence or notice, and its API metadata reports `license: null`. It also declares no upstream and has no stated terms for redistribution. PokeAPI/sprites states terms and an invitation, so it is the better source to bundle. Its default PNGs are also a different size (96×96, versus 40×30 here).

## Alternatives (not chosen)

`msikma/pokesprite` has its code under MIT and says its sprite images are "© Nintendo/Creatures Inc./GAME FREAK Inc." ([license.md](https://github.com/msikma/pokesprite/blob/master/license.md), README "License" section). It provides 68×56 box sprites, including regional forms. It would be a workable fallback, but it has no equivalent invitation to reuse and needs a slug-based mapping. The Pokémon Showdown client repo does not include its `/sprites/` directory (README), so it is not a bundling source.

## Caveats

- This is a reading of the published terms, not a rights-holder licence for the artwork.
- Coverage of Run & Bun-specific forms was not exhaustively audited; unmapped names need a fallback sprite.
- Re-pin both revisions deliberately; the two repos change independently.

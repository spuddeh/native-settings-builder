# Native Settings Builder

A web tool for Cyberpunk 2077 mod authors: visually configure an in-game settings menu
(Native Settings UI) and export a ready-to-ship Cyber Engine Tweaks mod folder. No Lua
knowledge required for the common cases.

Built for the location-modding community, where wiring up Native Settings menus (especially
subcategories and shared tabs) is a recurring hurdle when shipping sector variants.

## What it does

- Form-based editor for the whole menu: sections, switches, sliders, selectors, buttons and
  key bindings, with live validation.
- Live preview styled after the in-game Mods settings screen.
- Variant-aware: switches and selectors can directly toggle World Builder sector variants
  (`TogglePrefabVariant`), swap between two variants, or toggle Native Interactions projects.
- Exports a complete CET mod: a fixed, reusable Lua runtime plus your generated
  `settings.json` and a README with the correct dependency list.
- Re-editing: import a previously exported `settings.json`, change it, re-export. Player
  choices survive updates.
- Optional extras: per-language translations, LocKey passthrough, hidden API-driven options,
  mod compatibility rules, own tab or shared tab for mod families.

## Using it

Open the site (GitHub Pages), build your menu, press Export. Install the zip like any mod.
Docs:

- [Exporting and shipping](docs/exporting.md)
- [settings.json schema](docs/schema.md)
- [The Lua runtime](docs/runtime.md)
- [Prior art review](docs/prior-art-review.md): the three community implementations this
  builder learned from

## Development

```bash
npm install
npm run dev     # local dev server
npm run build   # type-check + production build into dist/
```

The canonical Lua runtime lives in `runtime-template/` and is bundled into exports at build
time. It is a normal CET mod folder: you can copy it into the game with a hand-written
`settings.json` to iterate on the runtime directly.

Deployment is automatic: pushes to `main` build and publish to GitHub Pages.

## Player requirements (for exported mods)

- [Cyber Engine Tweaks](https://www.nexusmods.com/cyberpunk2077/mods/107)
- [Native Settings UI](https://www.nexusmods.com/cyberpunk2077/mods/3518)
- [Codeware](https://www.nexusmods.com/cyberpunk2077/mods/7780) (only when world variants or
  key bindings are used)
- [Native Interactions Framework](https://www.nexusmods.com/cyberpunk2077/mods/14964) (only
  when interaction toggles are used)

## Credits

- keanuWheeze: Native Settings UI and the original variant switcher example
- Akiway: the improved variant example this runtime's persistence and localization approach
  is based on
- psiberx: GameUI.lua (vendored unmodified in the runtime)
- The Locations Hub community for surfacing the problem

## Disclaimer

Large language model assistance (Claude) was used in the development of this tool.
All generated code has been reviewed and tested.

## License

[PolyForm Noncommercial 1.0.0](LICENSE.md). You may use, modify and share this tool and its
runtime for noncommercial purposes; exported runtimes may be bundled with your (noncommercial)
mods freely.

# Exporting and shipping

## What the export contains

`Download mod zip` produces:

```text
<cetFolderName>-settings.zip
├── bin/x64/plugins/cyber_engine_tweaks/mods/<cetFolderName>/
│   ├── init.lua, modules/          fixed runtime (do not edit)
│   ├── settings.json               your menu definition
│   └── user_callbacks.lua          only if you use callbacks
└── README.md                       install instructions and requirements
```

The README's requirements list is derived from what you actually used: Codeware appears only if
you toggle world variants (or use key bindings), Native Interactions Framework only if you use
interaction toggles.

## Merging with your mod

The zip is a complete, working CET mod on its own; most authors will merge it into their existing
mod package next to their `archive` folder. If your mod already has a CET folder, either keep the
settings mod as its own folder (simplest) or move the files into your folder and keep the
`modules/` structure intact.

## Updating your menu later

1. Open the builder and use Import with the `settings.json` from your last export
   (or rely on the browser autosave).
2. Make your changes.
3. Re-export and replace `settings.json` (and `user_callbacks.lua`) in your mod package. The
   runtime files only need replacing when the builder shows a newer runtime version.

Player choices survive updates as long as option ids stay the same. The builder warns you when an
edit would reset saved values (changing an id, renaming selector choices).

## Testing checklist

- Open Settings, then Mods: the tab appears, sections are in order, tooltips read well.
- Change each option; verify the world reacts (variants) and `config.json` updates.
- Restart the game and reload a save: choices persist and re-apply.
- Press the game's restore defaults button: options, config and world all reset.
- Check the CET log (`cyber_engine_tweaks.log`) for lines prefixed with your mod name.
- For shared tabs: install a second mod of the family, verify both buttons appear, Back works,
  and removing one mod leaves the other intact.

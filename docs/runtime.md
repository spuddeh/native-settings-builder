# The Lua runtime

Every export bundles the same fixed runtime; only `settings.json` (and `user_callbacks.lua`, if
you use callbacks) differ between exports. Authors should never edit the runtime files: re-export
instead, so updates stay a drop-in replacement.

## Files

```text
bin/x64/plugins/cyber_engine_tweaks/mods/<cetFolderName>/
  init.lua              orchestrator and dependency guards
  settings.json         your generated menu definition
  user_callbacks.lua    your Lua snippets, wrapped in named functions (only if used)
  modules/
    definition.lua      loads and validates settings.json
    config.lua          persistence, reconciliation, migrations, compat rules
    builder.lua         definition to Native Settings widgets
    apply.lua           world variants, interaction toggles, callbacks
    sharedtab.lua       shared tab registry (multi-mod families)
    lang.lua            LocKey passthrough and translation overrides
    api.lua             public API for other mods
    GameUI.lua          psiberx's session observer, vendored unmodified
```

## Boot sequence (init.lua)

1. Load and validate `settings.json`; on failure print the exact problem and stop (nothing else
   breaks; the menu simply does not appear).
2. Check dependencies: Native Settings always; Codeware only if the definition uses world
   variants. Missing dependencies are reported with the mod's name and a download link.
3. Load `user_callbacks.lua` if present.
4. Load `config.json`, reconcile against the definition (drop obsolete ids, seed new ones, resolve
   selector strings), run compat rules, save if anything changed.
5. Build the menu: own tab directly, or register with the shared tab.
6. Register key listeners for keyBinding options (requires Codeware; a warning is printed
   otherwise).
7. On every session start, re-apply all world-affecting options.

## Shared tabs

Several mods exported with the same `sharedTab.id` present one tab. The registry lives on the
Native Settings tab data under the field `_nsbSubMenus`; the entry shape `{ name, callback }` is a
frozen wire protocol, so mods carrying different runtime versions still render each other's
entries. Do not add required fields to it.

The landing page lists registered mods alphabetically with an Enter button each; a mod's detail
view replaces the tab content and adds a Back button. Registration is idempotent, so CET's
"Reload All Mods" and any load order are safe.

The tab id `tidy_your_trash` is reserved: it belongs to the existing Tidy Your Trash family,
which uses its own registry protocol.

## Restore defaults

The game's "restore defaults" button on the tab resets all of this mod's options to their
definition defaults, saves `config.json`, re-applies world state and notifies API listeners.

## Public API

`GetMod("<cetFolderName>")` returns:

| Function | Behavior |
|----------|----------|
| `getValue(id)` | Current runtime value (selectors: 1-based index) |
| `setValue(id, value)` | Validates, saves, applies the effect, updates the live widget; selectors accept the index or the stable string |
| `setMultiple(map)` | Batch set with a single save |
| `getDefinition()` | The parsed settings.json table |
| `onChange(id, fn)` | Calls `fn(value)` whenever the option changes (menu, API, or restore defaults) |

## Key bindings caveat

Native Settings stores the chosen key; making it fire in-game requires Codeware's callback system
(`Input/Key`). The runtime registers this automatically and prints a warning when Codeware is
missing. Hold bindings fire your callback with `true` on press and `false` on release; normal
bindings fire with `true` on press only. This wiring is the newest part of the runtime; if you hit
issues with it, please report them.

## Error philosophy

Author callbacks are always pcall-wrapped: a typo in your snippet logs an error but cannot break
the menu or other options. Unknown definitions fail loudly at load with the option index and field
named. Missing optional dependencies (Native Interactions Framework) warn once at apply time.

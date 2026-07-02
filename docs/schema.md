# settings.json schema

The definition file the builder exports and the runtime reads. Current `schemaVersion`: **1**.
A machine-readable JSON Schema is published at `schema/settings.schema.json`.

## Top level

| Field | Type | Notes |
|-------|------|-------|
| `schemaVersion` | number | Format version; the runtime and the site both check it |
| `runtimeVersion` | string | The runtime bundled by the export that produced this file |
| `generator` | object | `site`, `siteVersion`, `exportedAt` (informational) |
| `mod` | object | Mod metadata, see below |
| `categories` | array | Ordered list of `{ id, label }`; render order is array order |
| `options` | array | Ordered list of options; render order is array order within each category |
| `translations` | object, optional | Per-language string overrides, see below |
| `compat` | array, optional | Mod compatibility rules, see below |

## `mod`

| Field | Type | Notes |
|-------|------|-------|
| `modName` | string | Player-facing name; may be a `LocKey#…` |
| `cetFolderName` | string | Folder under `.../cyber_engine_tweaks/mods/` |
| `author` | string | |
| `modVersion` | string | Semantic version |
| `tabMode` | `"own"` or `"shared"` | |
| `ownTab` | `{ id, label }` | Required when `tabMode` is `own` |
| `sharedTab` | `{ id, label, landingHeader? }` | Required when `tabMode` is `shared`; the id must be identical in every mod of the family |
| `subCategoryPrefix` | string, optional | Free text. In shared tabs it is shown before every section label ("Glen - Main" style). A sanitized form of it (or of the folder name, when empty) also prefixes subcategory paths so mods never collide in a shared tab |

## Options

Every option has two independent choices: the **widget** (`type`) that appears in the menu, and
the optional **effect** (`apply`) that runs when the value changes. An option without `apply` is a
plain value your own scripts can read through the runtime API.

Common fields: `id` (stable unique save key, `^[a-z0-9_]+$`, never change it after release),
`type`, `category`, `label`, `description`, `showInMenu` (default true; false hides the option so
it is only reachable via the API or compat rules).

| `type` | Extra fields | `default` |
|--------|--------------|-----------|
| `switch` | | boolean |
| `rangeInt` | `min`, `max`, `step` | number |
| `rangeFloat` | `min`, `max`, `step`, `format` (e.g. `"%.2f"`) | number |
| `selectorString` | `elements` (2+ strings) | 1-based index |
| `button` | `buttonText`, `textSize` (45 is the vanilla look) | none |
| `keyBinding` | `isHold` | `IK_*` key name |

## Effects (`apply`)

| `kind` | Fields | Legal on | What happens |
|--------|--------|----------|--------------|
| `variant` | `ref`, `variant` | switch | Variant shown when ON, hidden when OFF |
| `swap` | `ref`, `variantOn`, `variantOff` | switch | Exactly one of two variants is shown |
| `selectorVariant` | `ref`, `variants` (same length as `elements`) | selectorString | The chosen variant is shown, the rest hidden |
| `nif` | `project` | switch | Toggles a Native Interactions Framework project |
| `callback` | `function`, `lua` | any; required on button and keyBinding | Runs your Lua from `user_callbacks.lua` |

`ref` is the Variant Node Ref you entered when exporting from World Builder (usually starts with
`$/`). Variant names must match the streaming block exactly.

## Persistence notes

The runtime saves `config.json` next to `settings.json`:

```json
{ "schemaVersion": 1, "values": { "sofa_color": "sofa_teal", "guest_count": 3 }, "appliedCompat": [] }
```

Selector choices are saved as **strings** (the variant name for `selectorVariant`, the element
text otherwise), never as indices. Reordering choices in an update keeps player selections;
renaming or removing one resets only that option to its default. All other option ids map to their
raw values. Unknown ids are cleaned up on load, missing ones are seeded from defaults.

## `translations`

Optional per-language overrides keyed by game language code (`fr-fr`, `de-de`, ...). The inline
strings in the document are the English defaults. Keys:

- `<optionId>.label`, `<optionId>.description`, `<optionId>.buttonText`
- `<optionId>.elements`: a full replacement array for a selector's choices (display only; save
  keys stay the English strings)
- `categories.<categoryId>`, `mod.modName`, `mod.ownTab.label`

Independently of this block, any string starting with `LocKey#` is resolved through the game's
own localization at menu build time.

## `compat`

```json
{ "ifArchive": "some_other_mod.archive", "set": { "kitchen_style": true }, "once": true }
```

Evaluated on every launch via `ModArchiveExists`. With `once: true` the rule applies a single time
(recorded in `config.json` under `appliedCompat`), so the player can change the option back
afterwards. With `once: false` the values are re-asserted on every launch.

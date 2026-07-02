-- lang.lua — localization for menu strings.
-- Two mechanisms, both optional:
--   1. LocKey passthrough: any string starting with "LocKey#" resolves through the
--      game's own localization (free translation from vanilla strings).
--   2. A "translations" block in settings.json keyed by game language, overlaying
--      the inline strings (which act as the en-us defaults).
-- Part of the Native Settings Builder runtime v__RUNTIME_VERSION__. Do not edit.

local Lang = {
    translations = nil,
    lang = "en-us",
}

function Lang.init(def)
    Lang.translations = def.translations
    local ok, current = pcall(function()
        return Game.GetSettingsSystem():GetVar("/language", "OnScreen"):GetValue().value
    end)
    if ok and type(current) == "string" and Lang.translations and Lang.translations[current] then
        Lang.lang = current
    else
        Lang.lang = "en-us"
    end
end

-- Resolves LocKey strings through the game; returns plain strings unchanged.
function Lang.loc(text)
    if type(text) ~= "string" then
        return ""
    end
    if text:find("^LocKey#") then
        local localized = GetLocalizedText(text)
        if localized and localized ~= "" then
            return localized
        end
    end
    return text
end

-- Looks up "<key>" in the current language's translation table, falling back to
-- the inline string, then resolves LocKeys. Keys follow "<optionId>.label",
-- "<optionId>.description", "subcategories.<subcategoryId>", "mod.modName" etc.
function Lang.get(key, fallback)
    local overlay = Lang.translations and Lang.translations[Lang.lang]
    local value = overlay and overlay[key]
    if type(value) ~= "string" then
        value = fallback
    end
    return Lang.loc(value)
end

-- Element lists for selectors: translations key "<optionId>.elements" holds a full
-- replacement array; individual LocKey entries resolve either way.
function Lang.getElements(optionId, elements)
    local overlay = Lang.translations and Lang.translations[Lang.lang]
    local override = overlay and overlay[optionId .. ".elements"]
    local source = (type(override) == "table" and #override == #elements) and override or elements
    local out = {}
    for i, element in ipairs(source) do
        out[i] = Lang.loc(element)
    end
    return out
end

return Lang

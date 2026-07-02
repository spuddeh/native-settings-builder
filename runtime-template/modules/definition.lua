-- definition.lua — loads and validates settings.json (the menu definition).
-- Part of the Native Settings Builder runtime v__RUNTIME_VERSION__. Do not edit.

local Definition = {}

local KNOWN_TYPES = {
    switch = true,
    rangeInt = true,
    rangeFloat = true,
    selectorString = true,
    button = true,
    keyBinding = true,
}

local KNOWN_APPLY_KINDS = {
    variant = true,
    swap = true,
    selectorVariant = true,
    nif = true,
    callback = true,
}

local function readFile(path)
    local file = io.open(path, "r")
    if not file then
        return nil, "file not found: " .. path
    end
    local content = file:read("*a")
    file:close()
    return content
end

-- Shallow but explicit validation: names the exact option and field that is wrong,
-- since json.decode gives no line numbers.
function Definition.validate(def)
    if type(def) ~= "table" then
        return false, "definition is not a JSON object"
    end
    if type(def.schemaVersion) ~= "number" then
        return false, "missing or invalid 'schemaVersion'"
    end
    if type(def.mod) ~= "table" then
        return false, "missing 'mod' block"
    end
    if type(def.mod.modName) ~= "string" or def.mod.modName == "" then
        return false, "mod.modName missing"
    end
    if def.mod.tabMode ~= "own" and def.mod.tabMode ~= "shared" then
        return false, "mod.tabMode must be 'own' or 'shared'"
    end
    if def.mod.tabMode == "own" and (type(def.mod.ownTab) ~= "table" or type(def.mod.ownTab.id) ~= "string") then
        return false, "mod.ownTab.id missing (required for tabMode 'own')"
    end
    if def.mod.tabMode == "shared" and (type(def.mod.sharedTab) ~= "table" or type(def.mod.sharedTab.id) ~= "string") then
        return false, "mod.sharedTab.id missing (required for tabMode 'shared')"
    end
    if type(def.subcategories) ~= "table" then
        return false, "missing 'subcategories' array"
    end
    if type(def.options) ~= "table" then
        return false, "missing 'options' array"
    end

    local seenIds = {}
    for i, opt in ipairs(def.options) do
        local where = "option " .. i
        if type(opt.id) ~= "string" or opt.id == "" then
            return false, where .. " missing 'id'"
        end
        where = "option '" .. opt.id .. "'"
        if seenIds[opt.id] then
            return false, where .. " has a duplicate id"
        end
        seenIds[opt.id] = true
        if not KNOWN_TYPES[opt.type] then
            return false, where .. " has unknown type '" .. tostring(opt.type) .. "'"
        end
        if type(opt.subcategory) ~= "string" then
            return false, where .. " missing 'subcategory'"
        end
        if opt.type == "selectorString" and (type(opt.elements) ~= "table" or #opt.elements < 2) then
            return false, where .. " needs at least 2 elements"
        end
        if (opt.type == "rangeInt" or opt.type == "rangeFloat") then
            if type(opt.min) ~= "number" or type(opt.max) ~= "number" or type(opt.step) ~= "number" then
                return false, where .. " needs numeric min/max/step"
            end
        end
        if opt.apply ~= nil then
            if not KNOWN_APPLY_KINDS[opt.apply.kind] then
                return false, where .. " has unknown apply.kind '" .. tostring(opt.apply.kind) .. "'"
            end
            if opt.apply.kind == "selectorVariant" and #(opt.apply.variants or {}) ~= #(opt.elements or {}) then
                return false, where .. " apply.variants length must match elements length"
            end
        end
    end
    return true
end

function Definition.load(path)
    local content, err = readFile(path)
    if not content then
        return nil, err
    end
    local ok, def = pcall(function() return json.decode(content) end)
    if not ok then
        return nil, "invalid JSON: " .. tostring(def)
    end
    local valid, verr = Definition.validate(def)
    if not valid then
        return nil, verr
    end
    return def
end

function Definition.usesVariants(def)
    for _, opt in ipairs(def.options) do
        local kind = opt.apply and opt.apply.kind
        if kind == "variant" or kind == "swap" or kind == "selectorVariant" then
            return true
        end
    end
    return false
end

function Definition.optionById(def, id)
    for _, opt in ipairs(def.options) do
        if opt.id == id then
            return opt
        end
    end
    return nil
end

-- For selectors: the list of stable strings the choice is persisted as.
-- selectorVariant persists the world variant name, plain selectors the element label.
function Definition.selectorKeys(opt)
    if opt.apply and opt.apply.kind == "selectorVariant" then
        return opt.apply.variants
    end
    return opt.elements
end

return Definition

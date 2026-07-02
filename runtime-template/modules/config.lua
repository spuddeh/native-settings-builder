-- config.lua — persistence for user choices, plus compat rules.
-- Saves a minimal map of { optionId: value } so mod updates never conflict with
-- saved data. Selector choices are persisted as strings (element or variant name),
-- never as indices, so reordering options between mod versions is safe.
-- Part of the Native Settings Builder runtime v__RUNTIME_VERSION__. Do not edit.

local Definition = require("modules/definition")

local Config = {}

Config.SCHEMA_VERSION = 1

-- Migration hooks: MIGRATIONS[fromVersion] takes the raw decoded config table and
-- returns it upgraded to fromVersion + 1. Empty while SCHEMA_VERSION == 1.
local MIGRATIONS = {}

local function readDecoded(path)
    local file = io.open(path, "r")
    if not file then
        return nil
    end
    local content = file:read("*a")
    file:close()
    local ok, decoded = pcall(function() return json.decode(content) end)
    if not ok or type(decoded) ~= "table" then
        return nil
    end
    return decoded
end

local function indexOf(list, value)
    for i, v in ipairs(list or {}) do
        if v == value then
            return i
        end
    end
    return nil
end

-- Reconcile one saved value against its option definition.
-- Returns the runtime value (selector values become 1-based indices in memory).
local function reconcile(opt, savedValue)
    if opt.type == "switch" then
        if type(savedValue) == "boolean" then
            return savedValue
        end
        return opt.default == true
    elseif opt.type == "rangeInt" or opt.type == "rangeFloat" then
        if type(savedValue) == "number" and savedValue >= opt.min and savedValue <= opt.max then
            return savedValue
        end
        return opt.default
    elseif opt.type == "selectorString" then
        local keys = Definition.selectorKeys(opt)
        if type(savedValue) == "string" then
            local idx = indexOf(keys, savedValue)
            if idx then
                return idx
            end
        elseif type(savedValue) == "number" and savedValue >= 1 and savedValue <= #keys then
            -- tolerate legacy index-based saves
            return math.floor(savedValue)
        end
        return opt.default
    elseif opt.type == "keyBinding" then
        if type(savedValue) == "string" and savedValue:sub(1, 3) == "IK_" then
            return savedValue
        end
        return opt.default
    end
    return nil -- buttons hold no value
end

-- Returns values (id -> runtime value), appliedCompat (set), needsSave (bool).
function Config.load(path, def)
    local needsSave = false
    local raw = readDecoded(path)
    if raw == nil then
        raw = {}
        needsSave = true
    end

    local version = tonumber(raw.schemaVersion) or Config.SCHEMA_VERSION
    while version < Config.SCHEMA_VERSION do
        local migrate = MIGRATIONS[version]
        if not migrate then
            break
        end
        raw = migrate(raw)
        version = version + 1
        needsSave = true
    end

    local saved = raw.values
    if type(saved) ~= "table" then
        saved = {}
        needsSave = true
    end

    local values = {}
    for _, opt in ipairs(def.options) do
        if opt.type ~= "button" then
            values[opt.id] = reconcile(opt, saved[opt.id])
            if saved[opt.id] == nil then
                needsSave = true
            end
        end
    end
    -- Obsolete keys (removed options) trigger a cleanup save.
    for id in pairs(saved) do
        if Definition.optionById(def, id) == nil or Definition.optionById(def, id).type == "button" then
            needsSave = true
        end
    end

    local appliedCompat = {}
    if type(raw.appliedCompat) == "table" then
        for _, key in ipairs(raw.appliedCompat) do
            appliedCompat[key] = true
        end
    end

    return values, appliedCompat, needsSave
end

function Config.save(path, def, values, appliedCompat)
    local outValues = {}
    local isEmpty = true
    for _, opt in ipairs(def.options) do
        if opt.type ~= "button" and values[opt.id] ~= nil then
            if opt.type == "selectorString" then
                local keys = Definition.selectorKeys(opt)
                outValues[opt.id] = keys[values[opt.id]] or keys[opt.default]
            else
                outValues[opt.id] = values[opt.id]
            end
            isEmpty = false
        end
    end

    local outCompat = {}
    for key in pairs(appliedCompat or {}) do
        table.insert(outCompat, key)
    end
    table.sort(outCompat)

    local encoded
    if isEmpty then
        -- CET's json.encode turns an empty table into "[]", which would break decode-as-map.
        encoded = string.format('{"schemaVersion":%d,"values":{},"appliedCompat":[]}', Config.SCHEMA_VERSION)
    else
        encoded = json.encode({
            schemaVersion = Config.SCHEMA_VERSION,
            values = outValues,
            appliedCompat = outCompat,
        })
    end

    local file = io.open(path, "w")
    if not file then
        return false
    end
    file:write(encoded)
    file:close()
    return true
end

-- Compat rules: [{ ifArchive = "x.archive", set = { optionId = value }, once = true }].
-- Mutates ctx.values / ctx.appliedCompat; returns true if anything changed.
function Config.applyCompatRules(ctx)
    local changed = false
    for i, rule in ipairs(ctx.def.compat or {}) do
        if type(rule.ifArchive) == "string" and ModArchiveExists(rule.ifArchive) then
            local key = tostring(i) .. ":" .. rule.ifArchive
            if not (rule.once and ctx.appliedCompat[key]) then
                for id, value in pairs(rule.set or {}) do
                    local opt = Definition.optionById(ctx.def, id)
                    if opt and opt.type ~= "button" then
                        local newValue = reconcile(opt, value)
                        if ctx.values[id] ~= newValue then
                            ctx.values[id] = newValue
                            changed = true
                        end
                    else
                        print(ctx.logPrefix .. " WARN: compat rule " .. i .. " references unknown option '" .. tostring(id) .. "'")
                    end
                end
                if rule.once and not ctx.appliedCompat[key] then
                    ctx.appliedCompat[key] = true
                    changed = true
                end
            end
        end
    end
    return changed
end

return Config

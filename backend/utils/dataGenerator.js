const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const { applyRandomFormat } = require('./randomizer');

function parseArray(val) {
    if (!val) return [];
    if (typeof val === "string") {
        try { return JSON.parse(val); } catch (e) { /* fallback */ }
        return val.split(',').map(s => s.trim());
    }
    return Array.isArray(val) ? val : [];
}

function powerSet(arr) {
    // Returns all subsets except the empty set
    const results = [];
    const n = arr.length;
    for (let i = 1; i < (1 << n); ++i) {
        const subset = [];
        for (let j = 0; j < n; ++j)
            if (i & (1 << j)) subset.push(arr[j]);
        results.push(subset);
    }
    // Sort by descending length (most specific to least)
    results.sort((a, b) => b.length - a.length);
    return results;
}

function bestMatchRows(allRows, filters) {
    // Try all filter combinations, most specific first, always keep state if present
    const keys = Object.keys(filters).filter(k => filters[k].length > 0);
    let stateKey = keys.find(k => k.toLowerCase().includes('state'));
    let keysNoState = stateKey ? keys.filter(k => k !== stateKey) : keys;
    const allCombos = powerSet(keysNoState).map(subset => (stateKey ? [stateKey, ...subset] : subset));
    for (const combo of allCombos) {
        const found = allRows.filter(row =>
            combo.every(key => filters[key].includes(row[key]))
        );
        if (found.length) return found;
    }
    return [];
}

function loadConfig(recordType) {
    const configPath = path.join(__dirname, '../config', `${recordType}Form.config.json`);
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { randomize: {} };
}

function generateData(params, dumpData) {
    // Parse dump data
    const parsedDump = Papa.parse(dumpData, { header: true, skipEmptyLines: true });
    if (!parsedDump.data || !parsedDump.data.length) {
        return {
            csv: "",
            stats: { success: 0, failed: 0 },
            error: "No data source found or file is empty."
        };
    }
    const { recordType = "Account", numRecords = 10 } = params;
    const config = loadConfig(recordType);
    const filters = {
        State: parseArray(params.states),
        ProductGroup: parseArray(params.productGroups),
        GroupSize: parseArray(params.groupSizes),
        FundingType: parseArray(params.fundingTypes),
        Product: parseArray(params.products)
    };
    // Try to find best matching rows
    let matchingRows = bestMatchRows(parsedDump.data, filters);
    if (!matchingRows.length) {
        return {
            csv: "",
            stats: { success: 0, failed: 0 },
            error: "No data found for selected configuration."
        };
    }
    // If less than needed, cycle/duplicate to fill
    let records = [];
    for (let i = 0; i < numRecords; ++i) {
        records.push({ ...matchingRows[i % matchingRows.length] });
    }
    // Apply randomization
    let failed = 0;
    records = records.map((row, idx) => {
        try {
            for (const [field, format] of Object.entries(config.randomize || {})) {
                row[field] = applyRandomFormat(format);
            }
            row.Status = 'Success';
            row.Message = '';
        } catch (e) {
            row.Status = 'Failed';
            row.Message = String(e);
            failed++;
        }
        return row;
    });

    // Prepare CSV (in same column order as input)
    // ... after records array is created and filled ...
    let outputFields;

    if (parsedDump.meta && parsedDump.meta.fields && parsedDump.meta.fields.length > 0) {
        outputFields = [...parsedDump.meta.fields];
    } else {
        // fallback: union of all keys in all rows
        outputFields = Array.from(
            records.reduce((set, rec) => {
                Object.keys(rec).forEach(k => set.add(k));
                return set;
            }, new Set())
        );
    }
    if (!outputFields.includes('Status')) outputFields.push('Status');
    if (!outputFields.includes('Message')) outputFields.push('Message');
    if (!outputFields.includes('Status')) outputFields.push('Status');
    if (!outputFields.includes('Message')) outputFields.push('Message');
    const csv = Papa.unparse(records, { columns: outputFields });
    return {
        csv,
        stats: { success: records.length - failed, failed },
        error: failed ? "Some records failed to randomize." : ""
    };
}

module.exports = { generateData };

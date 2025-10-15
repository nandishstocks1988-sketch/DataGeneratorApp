const RECORD_TYPES = [
    { name: "Account", icon: "account_box" },
    { name: "Contacts", icon: "contacts" },
    { name: "Leads", icon: "person_search" },
    { name: "Team Members", icon: "group" },
    { name: "Group Number", icon: "pin" },
    { name: "Quote", icon: "request_quote" },
    { name: "Case", icon: "assignment" },
    { name: "Opportunity", icon: "trending_up" }
];

const STATES = ["CA", "CO", "CT", "GA", "IN", "KY", "ME", "MO", "NH", "NV", "OH", "VA", "WI"];
const PRODUCT_GROUPS = ["HRA", "HSA", "EPO", "PPO", "POS", "HMO"];
const GROUP_SIZES = ["51-99", "100-249", "250+"];
const FUNDING_TYPES = ["FI", "ASO", "ASO/ABF"];
const PRODUCTS = ["Medical", "Dental", "Vision", "Specialty"];
const MULTI_FIELDS = [
    { id: "states", options: STATES },
    { id: "productGroups", options: PRODUCT_GROUPS },
    { id: "groupSizes", options: GROUP_SIZES },
    { id: "fundingTypes", options: FUNDING_TYPES },
    { id: "products", options: PRODUCTS }
];

let currentRecordType = RECORD_TYPES[0].name;
let lastCSV = '';
let advancedCombos = [];
let advancedModeEnabled = false;

function renderTabs() {
    const tabsEl = document.getElementById('tabs');
    tabsEl.innerHTML = RECORD_TYPES.map(rt =>
        `<button class="tab-btn${currentRecordType === rt.name ? " active" : ""}" onclick="switchTab('${rt.name}')">
            <span class="material-icons">${rt.icon}</span> ${rt.name}
        </button>`
    ).join('');
}

function switchTab(type) {
    currentRecordType = type;
    renderTabs();
    clearResults();
    document.getElementById('dataGenForm').reset();
    MULTI_FIELDS.forEach(f => renderMultiSelect(f.id, f.options));
    advancedCombos = [];
    advancedModeEnabled = false;
    document.getElementById('advancedModal').style.display = 'none';
}

// ---- "Select All" feature implementation ----
function renderMultiSelect(id, options) {
    const container = document.getElementById(id);
    const selectAllId = `selectAll_${id}`;
    // Build "Select All" + options
    container.innerHTML =
        `<label class="select-all-label">
        <input type="checkbox" id="${selectAllId}" /> Select All
    </label>` +
        options.map(opt =>
            `<label>
            <input type="checkbox" value="${opt}" class="multi-checkbox" data-group="${id}" /> ${opt}
        </label>`
        ).join('');

    // Attach logic after these elements exist in DOM
    setTimeout(() => {
        const selectAllBox = document.getElementById(selectAllId);
        const checkboxes = Array.from(container.querySelectorAll('input.multi-checkbox'));

        selectAllBox.addEventListener('change', function () {
            checkboxes.forEach(cb => { cb.checked = selectAllBox.checked; });
        });

        checkboxes.forEach(cb =>
            cb.addEventListener('change', function () {
                selectAllBox.checked = checkboxes.length > 0 && checkboxes.every(b => b.checked);
            })
        );
    });
}
// ---- END "Select All" feature ----

function getMultiSelected(id) {
    return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"].multi-checkbox:checked`)).map(c => c.value);
}

function showAdvancedOptions() {
    const states = getMultiSelected('states');
    const productGroups = getMultiSelected('productGroups');
    const groupSizes = getMultiSelected('groupSizes');
    const fundingTypes = getMultiSelected('fundingTypes');
    const products = getMultiSelected('products');
    if (!states.length) {
        showModal(`<div style="color:#c00;margin-bottom:10px;">Select at least one State to use advanced options.</div>`);
        return;
    }
    let advFormHtml = states.map((state, idx) => {
        let pgHtml = productGroups.map(pg => `
            <div class="adv-opt-row">
                <div class="adv-opt-label">Product Group: ${pg}</div>
                <input type="number" min="0" value="0" class="adv-count-input" id="advPG_${idx}_${pg}" />
            </div>
        `).join('');
        let gsHtml = groupSizes.map(gs => `
            <div class="adv-opt-row">
                <div class="adv-opt-label">Group Size: ${gs}</div>
                <input type="number" min="0" value="0" class="adv-count-input" id="advGS_${idx}_${gs}" />
            </div>
        `).join('');
        let ftHtml = fundingTypes.map(ft => `
            <div class="adv-opt-row">
                <div class="adv-opt-label">Funding Type: ${ft}</div>
                <input type="number" min="0" value="0" class="adv-count-input" id="advFT_${idx}_${ft}" />
            </div>
        `).join('');
        let prHtml = products.map(pr => `
            <div class="adv-opt-row">
                <div class="adv-opt-label">Product: ${pr}</div>
                <input type="number" min="0" value="0" class="adv-count-input" id="advPR_${idx}_${pr}" />
            </div>
        `).join('');
        return `<div class="adv-state-block">
            <div class="adv-state-label">${state}</div>
            <div class="adv-opt-row">
                <div class="adv-opt-label">Total records for ${state}</div>
                <input type="number" min="0" value="0" class="adv-state-count-input" id="advStateCount_${idx}" />
            </div>
            ${productGroups.length ? `<div><strong>Product Groups</strong>${pgHtml}</div>` : ""}
            ${groupSizes.length ? `<div><strong>Group Sizes</strong>${gsHtml}</div>` : ""}
            ${fundingTypes.length ? `<div><strong>Funding Types</strong>${ftHtml}</div>` : ""}
            ${products.length ? `<div><strong>Products</strong>${prHtml}</div>` : ""}
        </div>`;
    }).join('');
    showModal(advFormHtml);
}

function showModal(html) {
    document.getElementById('advFormArea').innerHTML = html;
    document.getElementById('advancedError').textContent = '';
    document.getElementById('advancedModal').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('modalContent').scrollTop = 0;
    }, 0);
}

function applyAdvancedOptions() {
    const states = getMultiSelected('states');
    const productGroups = getMultiSelected('productGroups');
    const groupSizes = getMultiSelected('groupSizes');
    const fundingTypes = getMultiSelected('fundingTypes');
    const products = getMultiSelected('products');
    let combos = [];
    let totalStateRecords = 0;
    let totalRecords = parseInt(document.getElementById('numRecords').value, 10) || 0;
    let error = "";
    states.forEach((state, idx) => {
        let stateCount = parseInt(document.getElementById(`advStateCount_${idx}`).value, 10) || 0;
        totalStateRecords += stateCount;
        let pgCombo = productGroups.map(pg => ({
            name: pg,
            count: parseInt(document.getElementById(`advPG_${idx}_${pg}`).value, 10) || 0
        })).filter(c => c.count > 0);
        let gsCombo = groupSizes.map(gs => ({
            name: gs,
            count: parseInt(document.getElementById(`advGS_${idx}_${gs}`).value, 10) || 0
        })).filter(c => c.count > 0);
        let ftCombo = fundingTypes.map(ft => ({
            name: ft,
            count: parseInt(document.getElementById(`advFT_${idx}_${ft}`).value, 10) || 0
        })).filter(c => c.count > 0);
        let prCombo = products.map(pr => ({
            name: pr,
            count: parseInt(document.getElementById(`advPR_${idx}_${pr}`).value, 10) || 0
        })).filter(c => c.count > 0);

        let sumPG = pgCombo.reduce((s, c) => s + c.count, 0);
        let sumGS = gsCombo.reduce((s, c) => s + c.count, 0);
        let sumFT = ftCombo.reduce((s, c) => s + c.count, 0);
        let sumPR = prCombo.reduce((s, c) => s + c.count, 0);

        if (sumPG > stateCount && productGroups.length) error = `Sum of Product Group counts for ${state} (${sumPG}) exceeds total records for this state (${stateCount}).`;
        if (sumGS > stateCount && groupSizes.length) error = `Sum of Group Size counts for ${state} (${sumGS}) exceeds total records for this state (${stateCount}).`;
        if (sumFT > stateCount && fundingTypes.length) error = `Sum of Funding Type counts for ${state} (${sumFT}) exceeds total records for this state (${stateCount}).`;
        if (sumPR > stateCount && products.length) error = `Sum of Product counts for ${state} (${sumPR}) exceeds total records for this state (${stateCount}).`;
        if (stateCount < 0) error = "Record count cannot be negative.";

        combos.push({ state, stateCount, pgCombo, gsCombo, ftCombo, prCombo });
    });
    if (totalStateRecords > totalRecords) {
        error = `Total records for all states (${totalStateRecords}) cannot exceed total records to generate (${totalRecords}).`;
    }
    if (error) {
        document.getElementById('advancedError').textContent = error;
        return;
    }
    advancedCombos = combos.filter(c => c.stateCount > 0);
    advancedModeEnabled = true;
    document.getElementById('advancedModal').style.display = 'none';
    document.getElementById('successMsg').innerHTML = `<div class="success">Advanced options applied! Now click "Generate" to get your customized records.</div>`;
}

function clearResults() {
    document.getElementById('successMsg').innerHTML = '';
    document.getElementById('downloadBtn').style.display = 'none';
    document.getElementById('advancedModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    renderTabs();
    MULTI_FIELDS.forEach(f => renderMultiSelect(f.id, f.options));
    document.getElementById('dataGenForm').addEventListener('submit', function (e) {
        e.preventDefault();
        generateData();
    });
    document.getElementById('downloadBtn').addEventListener('click', downloadCSV);
    document.getElementById('advancedBtn').addEventListener('click', showAdvancedOptions);
    document.getElementById('applyAdvancedBtn').addEventListener('click', applyAdvancedOptions);
    document.getElementById('closeAdv').addEventListener('click', () => {
        document.getElementById('advancedModal').style.display = 'none';
    });
});

function generateData() {
    let records = [];
    const numRecords = Math.max(1, parseInt(document.getElementById('numRecords').value, 10) || 1);
    if (advancedModeEnabled && advancedCombos.length) {
        advancedCombos.forEach(ac => {
            if (ac.pgCombo.length) {
                ac.pgCombo.forEach(pgC => {
                    for (let i = 0; i < pgC.count; i++) {
                        records.push([ac.state, pgC.name, '', '', '', currentRecordType, 'Success', '']);
                    }
                });
            }
            if (ac.gsCombo.length) {
                ac.gsCombo.forEach(gsC => {
                    for (let i = 0; i < gsC.count; i++) {
                        records.push([ac.state, '', gsC.name, '', '', currentRecordType, 'Success', '']);
                    }
                });
            }
            if (ac.ftCombo.length) {
                ac.ftCombo.forEach(ftC => {
                    for (let i = 0; i < ftC.count; i++) {
                        records.push([ac.state, '', '', ftC.name, '', currentRecordType, 'Success', '']);
                    }
                });
            }
            if (ac.prCombo.length) {
                ac.prCombo.forEach(prC => {
                    for (let i = 0; i < prC.count; i++) {
                        records.push([ac.state, '', '', '', prC.name, currentRecordType, 'Success', '']);
                    }
                });
            }
            if (!ac.pgCombo.length && !ac.gsCombo.length && !ac.ftCombo.length && !ac.prCombo.length) {
                for (let i = 0; i < ac.stateCount; i++) {
                    records.push([ac.state, '', '', '', '', currentRecordType, 'Success', '']);
                }
            }
        });
    } else {
        const states = getMultiSelected('states');
        const productGroups = getMultiSelected('productGroups');
        const groupSizes = getMultiSelected('groupSizes');
        const fundingTypes = getMultiSelected('fundingTypes');
        const products = getMultiSelected('products');
        for (let i = 0; i < numRecords; i++) {
            records.push([
                states[i % states.length] || '',
                productGroups[i % productGroups.length] || '',
                groupSizes[i % groupSizes.length] || '',
                fundingTypes[i % fundingTypes.length] || '',
                products[i % products.length] || '',
                currentRecordType,
                'Success', ''
            ]);
        }
    }
    lastCSV = ['State', 'ProductGroup', 'GroupSize', 'FundingType', 'Product', 'RecordType', 'Status', 'Message'].join(',') + '\n' +
        records.map(r => r.join(',')).join('\n');
    document.getElementById('downloadBtn').style.display = 'inline-flex';
    document.getElementById('successMsg').innerHTML =
        `<div class="success"><span class="material-icons">check_circle</span> Data generated: <b>${records.length}</b> records for <b>${currentRecordType}</b></div>`;
    advancedCombos = [];
    advancedModeEnabled = false;
}

function downloadCSV() {
    if (!lastCSV) return;
    const blob = new Blob([lastCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
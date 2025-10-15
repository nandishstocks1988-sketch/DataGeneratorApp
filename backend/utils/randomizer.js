const { v4: uuidv4 } = require('uuid');

function randNum(digits = 4) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice(list) {
    if (!Array.isArray(list)) list = String(list).split(',');
    const trimmed = list.map(s => s.trim()).filter(Boolean);
    return trimmed[Math.floor(Math.random() * trimmed.length)];
}

function randGuid() {
    return uuidv4();
}

function randDate(start, end) {
    const startDt = new Date(start);
    const endDt = new Date(end);
    const dt = new Date(startDt.getTime() + Math.random() * (endDt.getTime() - startDt.getTime()));
    return dt.toISOString().split('T')[0];
}

function randEmail() {
    const user = `user${randNum(5)}`;
    const doms = ['example.com', 'testmail.com', 'mailinator.com'];
    return `${user}@${randChoice(doms)}`;
}

function applyRandomFormat(format) {
    // Example: "Demo_{randNum:6}_Account", "{randChoice:a,b,c}", "{randGuid}"
    return format.replace(/\{randNum(?::(\d+))?\}/g, (_, d) => randNum(d ? parseInt(d) : 4))
        .replace(/\{randChoice:([^}]+)\}/g, (_, choices) => randChoice(choices.split(',')))
        .replace(/\{randGuid\}/g, () => randGuid())
        .replace(/\{randDate:([^,}]+),([^}]+)\}/g, (_, start, end) => randDate(start, end))
        .replace(/\{randEmail\}/g, () => randEmail());
}

module.exports = { randNum, randChoice, randGuid, randDate, randEmail, applyRandomFormat };

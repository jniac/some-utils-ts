export function parseNumberWithUnit(value) {
    const match = value.match(/\s*([0-9.]+)\s*(\/\s*[0-9.]+)?\s*([a-zA-Z]*)\s*?/);
    if (match === null) {
        throw new Error('Invalid number');
    }
    const [_, v, d, u = ''] = match;
    const n = Number.parseFloat(v) / (d ? Number.parseFloat(d.slice(1)) : 1);
    return [n, u];
}
//# sourceMappingURL=parse.js.map
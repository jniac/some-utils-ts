export function isObject(value) {
    return value !== null && typeof value === 'object';
}
export function isRecord(value) {
    return isObject(value) && Array.isArray(value) === false;
}
//# sourceMappingURL=common.js.map
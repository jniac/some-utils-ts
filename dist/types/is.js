export function isNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value);
}
export function isVector2Like(obj) {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number';
}
export { isVector2Like as isPoint2Like };
export function isVector3Like(obj) {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number';
}
export { isVector3Like as isPoint3Like };
export function isRectangleLike(obj) {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.width === 'number' && typeof obj.height === 'number';
}

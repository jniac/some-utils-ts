export function dot2(u, v) {
    return u.x * v.x + u.y * v.y;
}
export function cross2(u, v) {
    return u.x * v.y - u.y * v.x;
}
export function length2(u) {
    return Math.hypot(u.x, u.y);
}
export function distance2(u, v) {
    const x = v.x - u.x;
    const y = v.y - u.y;
    return Math.hypot(x, y);
}
export function sqDistance2(u, v) {
    const x = v.x - u.x;
    const y = v.y - u.y;
    return x * x + y * y;
}
export function manhattanDistance2(u, v) {
    return Math.abs(v.x - u.x) + Math.abs(v.y - u.y);
}
export function vectorAngle2(u, v) {
    return Math.atan2(cross2(u, v), dot2(u, v));
}
//# sourceMappingURL=geom2.js.map
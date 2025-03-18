export function dot2(u, v) {
    return u.x * v.x + u.y * v.y;
}
export function cross2(u, v) {
    return u.x * v.y - u.y * v.x;
}
export function length2(u) {
    return Math.hypot(u.x, u.y);
}
export function vectorAngle2(u, v) {
    return Math.atan2(cross2(u, v), dot2(u, v));
}

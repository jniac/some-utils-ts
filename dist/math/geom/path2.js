import { fromAngleDeclaration, fromVector2Declaration } from '../../declaration.js';
import { bezier2, cubicBezierArcControlPoints } from './bezier.js';
import { Line2 } from './line2.js';
function fromTransform2Declaration(value, out = [0, 0, 0, 0, 0, 0, 0, 0, 0], rowMajor = true) {
    if (Array.isArray(value)) {
        if (value.length === 9 && value.every((v) => typeof v === 'number')) {
            return value;
        }
        throw new Error('Invalid Transform2 declaration');
    }
    const { x = 0, y = 0, translation = { x, y }, scale = { x: 1, y: 1 }, rotation = 0, } = value;
    const a = fromAngleDeclaration(rotation);
    const c = Math.cos(a);
    const s = Math.sin(a);
    const { x: tx, y: ty } = fromVector2Declaration(translation);
    const { x: sx, y: sy } = fromVector2Declaration(scale);
    if (rowMajor) {
        out[0] = c * sx;
        out[3] = -s * sy;
        out[6] = tx;
        out[1] = s * sx;
        out[4] = c * sy;
        out[7] = ty;
        out[2] = 0;
        out[5] = 0;
        out[8] = 1;
    }
    else {
        out[0] = c * sx;
        out[1] = -s * sy;
        out[2] = tx;
        out[3] = s * sx;
        out[4] = c * sy;
        out[5] = ty;
        out[6] = 0;
        out[7] = 0;
        out[8] = 1;
    }
    return out;
}
function transform(points, matrix3, rowMajor = true) {
    for (const p of points) {
        const x = p.x;
        const y = p.y;
        if (rowMajor) {
            p.x = matrix3[0] * x + matrix3[3] * y + matrix3[6];
            p.y = matrix3[1] * x + matrix3[4] * y + matrix3[7];
        }
        else {
            p.x = matrix3[0] * x + matrix3[1] * y + matrix3[2];
            p.y = matrix3[3] * x + matrix3[4] * y + matrix3[5];
        }
    }
}
function offset(points, amount) {
    const constructor = points[0].constructor;
    const result = [];
    const n = points.length;
    const line1 = new Line2();
    const line2 = new Line2();
    for (let i = 0; i < n; i++) {
        const p = new constructor();
        result.push(p);
        const a = points[(i + n - 1) % n];
        const b = points[i];
        const c = points[(i + 1) % n];
        line1.fromStartEnd(a, b).offset(amount);
        line2.fromStartEnd(b, c).offset(amount);
        if (line1.intersection(line2, { out: p }) === null) {
            // parallel / collinear
            p.x = line2.ox;
            p.y = line2.oy;
        }
    }
    return result;
}
/**
 *
 * @param points Points of the polygon
 * @param radius
 * @param tension
 * @param resolution The number of segments for Math.PI arc.
 * @returns
 */
function roundCorner(points, radius, tension, resolution) {
    const constructor = points[0].constructor;
    const result = [];
    const n = points.length;
    const line1 = new Line2();
    const line2 = new Line2();
    const p = new constructor();
    const cp = [new constructor(), new constructor(), new constructor(), new constructor()];
    for (let i = 0; i < n; i++) {
        const a = points[(i + n - 1) % n];
        const b = points[i];
        const c = points[(i + 1) % n];
        line1.fromStartEnd(a, b).offset(-radius);
        line2.fromStartEnd(b, c).offset(-radius);
        if (line1.intersection(line2, { out: p }) === null) {
            // parallel / collinear
            const p = new constructor();
            p.x = b.x;
            p.y = b.y;
            result.push(p);
        }
        else {
            let a1 = line1.angle() - Math.PI / 2;
            let a2 = line2.angle() - Math.PI / 2;
            if (Math.abs(a1 - a2) > Math.PI) {
                if (a1 < a2) {
                    a1 += Math.PI * 2;
                }
                else {
                    a2 += Math.PI * 2;
                }
            }
            const arc = a2 - a1;
            const count = Math.ceil(Math.abs(arc) / Math.PI * resolution);
            cubicBezierArcControlPoints(p, radius, a1, a2, tension, cp);
            for (let j = 0; j < count; j++) {
                const t = j / (count - 1);
                result.push(bezier2(cp, t));
            }
        }
    }
    return result;
}
export class Path2 {
    points;
    constructor(points = []) {
        this.points = points;
    }
    from(points, { pointType = Object, } = {}) {
        this.points = points.map(p => fromVector2Declaration(p, new pointType()));
        return this;
    }
    copy(source) {
        this.points = source.points.map(p => ({ ...p }));
        return this;
    }
    clone() {
        return new Path2(this.points.map(p => ({ ...p })));
    }
    set(points) {
        this.points = points;
        return this;
    }
    offset(amount) {
        this.points = offset(this.points, amount);
        return this;
    }
    transform(...values) {
        for (const value of values) {
            transform(this.points, fromTransform2Declaration(value));
        }
        return this;
    }
    roundCorner(radius, { tension = 1, resolution = 32 } = {}) {
        this.points = roundCorner(this.points, radius, tension, resolution);
        return this;
    }
}

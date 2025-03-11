import { fromVector2Declaration } from '../../declaration.js';
var Line2Side;
(function (Line2Side) {
    Line2Side[Line2Side["Left"] = -1] = "Left";
    Line2Side[Line2Side["On"] = 0] = "On";
    Line2Side[Line2Side["Right"] = 1] = "Right";
})(Line2Side || (Line2Side = {}));
function isLine2Like(value) {
    return (typeof value === 'object' && value !== null
        && 'ox' in value && typeof value.ox === 'number'
        && 'oy' in value && typeof value.oy === 'number'
        && 'vx' in value && typeof value.vx === 'number'
        && 'vy' in value && typeof value.vy === 'number');
}
function from(out, value) {
    if (Array.isArray(value)) {
        if (value.length === 2) {
            const [p0, p1] = value;
            const { x: ox, y: oy } = fromVector2Declaration(p0);
            const { x: vx, y: vy } = fromVector2Declaration(p1);
            return out.set(ox, oy, vx, vy);
        }
        if (value.length !== 4 || value.every((v) => typeof v !== 'number')) {
            throw new Error('Invalid Line2 declaration');
        }
        const [ox, oy, vx, vy] = value;
        return out.set(ox, oy, vx, vy);
    }
    if (isLine2Like(value)) {
        return out.set(value.ox, value.oy, value.vx, value.vy);
    }
    throw new Error('Invalid Line2 declaration');
}
function fromStartEnd(out, value) {
    if (value.length === 4) {
        const [x1, y1, x2, y2] = value;
        return out.set(x1, y1, x2 - x1, y2 - y1);
    }
    if (value.length === 2) {
        const [start, end] = value;
        const { x: x1, y: y1 } = fromVector2Declaration(start);
        const { x: x2, y: y2 } = fromVector2Declaration(end);
        return out.set(x1, y1, x2 - x1, y2 - y1);
    }
    throw new Error('Invalid Line2 declaration');
}
function ensure(value) {
    if (value instanceof Line2) {
        return value;
    }
    return from(new Line2(), value);
}
class Line2 {
    static from(...args) {
        return new Line2().from(...args);
    }
    static ensure = ensure;
    ox = 0;
    oy = 0;
    vx = 1;
    vy = 0;
    set(ox, oy, vx, vy) {
        this.ox = ox;
        this.oy = oy;
        this.vx = vx;
        this.vy = vy;
        return this;
    }
    from(...args) {
        return args.length === 1
            ? from(this, args[0])
            : from(this, args);
    }
    fromStartEnd(...args) {
        return args.length === 1
            ? fromStartEnd(this, args[0])
            : fromStartEnd(this, args);
    }
    pointAt(t, { out = null, } = {}) {
        out ??= { x: 0, y: 0 };
        const { ox, oy, vx, vy } = this;
        out.x = ox + t * vx;
        out.y = oy + t * vy;
        return out;
    }
    p0(out = null) {
        out ??= { x: 0, y: 0 };
        out.x = this.ox;
        out.y = this.oy;
        return out;
    }
    p1(out = null) {
        out ??= { x: 0, y: 0 };
        out.x = this.ox + this.vx;
        out.y = this.oy + this.vy;
        return out;
    }
    vector(out = null) {
        out ??= { x: 0, y: 0 };
        out.x = this.vx;
        out.y = this.vy;
        return out;
    }
    orthogonal(out = null) {
        out ??= { x: 0, y: 0 };
        out.x = -this.vy;
        out.y = this.vx;
        return out;
    }
    computeT(point) {
        const { ox, oy, vx, vy } = this;
        const { x, y } = fromVector2Declaration(point);
        return ((x - ox) * vx + (y - oy) * vy) / (vx * vx + vy * vy);
    }
    project(point, { out = null, } = {}) {
        out ??= { x: 0, y: 0 };
        const t = this.computeT(point);
        const { ox, oy, vx, vy } = this;
        out.x = ox + t * vx;
        out.y = oy + t * vy;
        return out;
    }
    side(point, { epsilon = .000001, } = {}) {
        const { ox, oy, vx, vy } = this;
        const { x, y } = fromVector2Declaration(point);
        const cross = (x - ox) * vy - (y - oy) * vx;
        return cross < -epsilon ? Line2Side.Left : cross > epsilon ? Line2Side.Right : Line2Side.On;
    }
    // Sugar:
    start = this.p0;
    end = this.p1;
}
export { Line2, Line2Side };

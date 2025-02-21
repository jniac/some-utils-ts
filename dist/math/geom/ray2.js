export class Ray2 {
    static from(...args) {
        return new Ray2(...args);
    }
    ox = 0;
    oy = 0;
    dx = 1;
    dy = 0;
    constructor(...args) {
        if (args.length > 0) {
            this.set(...args);
        }
    }
    getOrigin(out = { x: 0, y: 0 }) {
        out.x = this.ox;
        out.y = this.oy;
        return out;
    }
    setOrigin(origin) {
        this.ox = origin.x;
        this.oy = origin.y;
        return this;
    }
    getDirection(out = { x: 0, y: 0 }) {
        out.x = this.dx;
        out.y = this.dy;
        return out;
    }
    setDirection(direction, { normalize = true } = {}) {
        let { x, y } = direction;
        if (normalize) {
            const length = Math.hypot(x, y);
            if (length === 0) {
                x = 1;
                y = 0;
            }
            else {
                x /= length;
                y /= length;
            }
        }
        this.dx = x;
        this.dy = y;
        return this;
    }
    set(...args) {
        if (args.length === 4) {
            const [ox, oy, dx, dy] = args;
            return (this
                .setOrigin({ x: ox, y: oy })
                .setDirection({ x: dx, y: dy }));
        }
        if (args.length === 2) {
            return (this
                .setOrigin(args[0])
                .setDirection(args[1]));
        }
        if (args.length === 1) {
            return (this
                .setOrigin(args[0].origin ?? this.origin)
                .setDirection(args[0].direction ?? this.direction));
        }
        throw new Error('Not implemented');
    }
    get origin() {
        return this.getOrigin();
    }
    set origin(origin) {
        this.setOrigin(origin);
    }
    get direction() {
        return this.getDirection();
    }
    set direction(direction) {
        this.setDirection(direction);
    }
}

import { Ray2Like, Vector2Like } from '../../types';
export type Ray2Args = [ox: number, oy: number, dx: number, dy: number] | [origin: {
    x: number;
    y: number;
}, direction: {
    x: number;
    y: number;
}] | [Partial<Ray2Like>];
export declare class Ray2 implements Ray2Like {
    static from(...args: Ray2Args): Ray2;
    ox: number;
    oy: number;
    dx: number;
    dy: number;
    constructor();
    constructor(...args: Ray2Args);
    getOrigin<T extends Vector2Like>(out?: T): T;
    setOrigin(origin: Vector2Like): this;
    getDirection<T extends Vector2Like>(out?: T): T;
    setDirection(direction: Vector2Like, { normalize }?: {
        normalize?: boolean | undefined;
    }): this;
    set(...args: Ray2Args): this;
    get origin(): Vector2Like;
    set origin(origin: Vector2Like);
    get direction(): Vector2Like;
    set direction(direction: Vector2Like);
}
//# sourceMappingURL=ray2.d.ts.map
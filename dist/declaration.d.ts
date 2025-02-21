import { Vector2Like, Vector3Like, Vector4Like } from './types';
/**
 * Because readonly types are compatible with their mutable counterparts, we can use this type to handle both cases.
 */
type ReadonlyOrNot<T> = T | Readonly<T>;
type Vector2DeclarationBase<T> = T | [x: T, y: T] | {
    x: T;
    y: T;
} | {
    width: T;
    height: T;
};
export type Vector2Declaration<T = number> = ReadonlyOrNot<Vector2DeclarationBase<T>>;
type Vector3DeclarationBase<T> = T | [x: T, y: T, z?: T] | {
    x: T;
    y: T;
    z?: T;
} | {
    width: T;
    height: T;
    depth?: T;
};
export type Vector3Declaration<T = number> = ReadonlyOrNot<Vector3DeclarationBase<T>>;
type Vector4DeclarationBase<T> = T | [x: T, y: T, z?: T, w?: T] | {
    x: T;
    y: T;
    z?: T;
    w?: T;
} | {
    width: T;
    height: T;
    depth?: T;
    time?: T;
} | {
    top: T;
    right: T;
    bottom: T;
    left: T;
};
export type Vector4Declaration<T = number> = ReadonlyOrNot<Vector4DeclarationBase<T>>;
export declare const angleUnits: readonly ["rad", "deg", "turn"];
export type AngleUnit = typeof angleUnits[number];
export type AngleDeclaration = number | `${number}` | `${number}${AngleUnit}` | `${number}/${number}${AngleUnit}`;
export declare const angleScalars: Record<AngleUnit, number>;
export declare function isAngleUnit(arg: any): arg is AngleUnit;
/**
 * Transforms the given angle declaration into a number in radians.
 */
export declare function fromAngleDeclaration(declaration: AngleDeclaration, defaultUnit?: AngleUnit): number;
export declare function toAngleDeclarationString(value: number, unit?: AngleUnit): string & AngleDeclaration;
type IsBaseType<T> = (v: any) => v is T;
export declare function isVector2Declaration<BaseType = number>(arg: any, isBaseType?: (v: any) => v is BaseType): arg is Vector2Declaration<BaseType>;
export declare function fromVector2Declaration<BaseType = number, T extends Vector2Like<BaseType> = Vector2Like<BaseType>>(arg: Vector2Declaration<BaseType>, out?: T, defaultValue?: BaseType, isBaseType?: IsBaseType<BaseType>): T;
export declare function toVector2Declaration<BaseType = number>(arg: Vector2Declaration<BaseType>): Vector2Declaration<BaseType>;
export declare function isVector3Declaration<BaseType = number>(arg: any, isBaseType?: (v: any) => v is BaseType): arg is Vector3Declaration<BaseType>;
export declare function fromVector3Declaration<BaseType = number, T extends Vector3Like<BaseType> = Vector3Like<BaseType>>(arg: Vector3Declaration<BaseType>, out?: T, defaultValue?: BaseType, isBaseType?: IsBaseType<BaseType>): T;
export declare function toVector3Declaration<BaseType = number>(arg: Vector3Declaration<BaseType>): Vector3Declaration<BaseType>;
export declare function isVector4Declaration<BaseType = number>(arg: any, isBaseType?: (v: any) => v is BaseType): arg is Vector4Declaration<BaseType>;
export declare function fromVector4Declaration<BaseType = number, T extends Vector4Like<BaseType> = Vector4Like<BaseType>>(arg: Vector4Declaration<BaseType>, out?: T, defaultValue?: BaseType, isBaseType?: IsBaseType<BaseType>): T;
export declare function toVector4Declaration<BaseType = number>(arg: Vector4Declaration<BaseType>): Vector4Declaration<BaseType>;
export {};

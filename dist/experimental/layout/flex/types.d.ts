import { ScalarDeclaration } from './Scalar';
export declare enum Direction {
    Horizontal = 2,
    Vertical = 3
}
export declare enum Positioning {
    /**
     * Flow children are included in the layout computation. They are positioned
     * relative to the parent space and to other children (previous children offset).
     */
    Flow = 0,
    /**
     * Detached children are not included in the layout computation. They are
     * positioned relative to the parent space only (not to other children).
     */
    Detached = 1
}
export type PositioningDeclaration = Positioning | 'flow' | 'detached';
export declare function parsePositioning(value: any): Positioning;
export type DirectionDeclaration = Direction | 'horizontal' | 'vertical';
export declare function parseDirection(value: any): Direction;
export type SizeDeclaration = ScalarDeclaration | [width: ScalarDeclaration, height: ScalarDeclaration] | {
    width: ScalarDeclaration;
    height: ScalarDeclaration;
};

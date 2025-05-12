import { Padding } from '../../../math/geom/padding';
import { Space } from './Space';
export declare function computeRootRect(space: Space): void;
export declare function computePadding(space: Space): Padding;
/**
 * Compute the rect of all children of a space.
 *
 * It assumes that the rect of the space itself has already been computed.
 */
export declare function computeChildrenRect(space: Space): void;
//# sourceMappingURL=Space.layout.d.ts.map
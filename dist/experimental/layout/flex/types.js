var All;
(function (All) {
    // Positioning:
    All[All["Flow"] = 0] = "Flow";
    All[All["Detached"] = 1] = "Detached";
    // Direction:
    All[All["Horizontal"] = 2] = "Horizontal";
    All[All["Vertical"] = 3] = "Vertical";
})(All || (All = {}));
export var Direction;
(function (Direction) {
    Direction[Direction["Horizontal"] = 2] = "Horizontal";
    Direction[Direction["Vertical"] = 3] = "Vertical";
})(Direction || (Direction = {}));
export var Positioning;
(function (Positioning) {
    /**
     * Flow children are included in the layout computation. They are positioned
     * relative to the parent space and to other children (previous children offset).
     */
    Positioning[Positioning["Flow"] = 0] = "Flow";
    /**
     * Detached children are not included in the layout computation. They are
     * positioned relative to the parent space only (not to other children).
     */
    Positioning[Positioning["Detached"] = 1] = "Detached";
})(Positioning || (Positioning = {}));
export function parsePositioning(value) {
    if (value in Positioning) {
        return value;
    }
    if (typeof value === 'string') {
        return value === 'flow'
            ? Positioning.Flow
            : Positioning.Detached;
    }
    throw new Error(`Invalid positioning value: ${value}`);
}
export function parseDirection(value) {
    if (value in Direction) {
        return value;
    }
    if (typeof value === 'string') {
        return value === 'horizontal'
            ? Direction.Horizontal
            : Direction.Vertical;
    }
    throw new Error(`Invalid direction value: ${value}`);
}

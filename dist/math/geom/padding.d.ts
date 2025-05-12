export type PaddingDeclaration = {
    all?: number;
    vertical?: number;
    horizontal?: number;
    top?: number;
    bottom?: number;
    right?: number;
    left?: number;
} | [top: number, right: number, bottom: number, left: number] | [vertical: number, horizontal: number] | [number] | number;
export declare class Padding {
    static from(value: PaddingDeclaration): Padding;
    static ensure(value: PaddingDeclaration): Padding;
    top: number;
    right: number;
    bottom: number;
    left: number;
    constructor(params?: PaddingDeclaration);
    [Symbol.iterator](): Generator<number>;
    setTRBL(top: number, right: number, bottom: number, left: number): this;
    set(params?: PaddingDeclaration): void;
    isHomogeneous(): boolean;
    get horizontal(): number;
    get vertical(): number;
    get all(): number;
    get totalHorizontal(): number;
    get totalVertical(): number;
    toCSS({ scalar }?: {
        scalar?: number | undefined;
    }): string;
    toStyle(filter?: string, { scalar }?: {
        scalar?: number | undefined;
    }): ({
        paddingTop: string;
        paddingRight: string;
        paddingBottom: string;
        paddingLeft: string;
    } | {
        marginTop: string;
        marginRight: string;
        marginBottom: string;
        marginLeft: string;
    });
}
//# sourceMappingURL=padding.d.ts.map
export function mergePrototypes(ClassA, ClassB) {
    const aProto = ClassA.prototype;
    const bProto = ClassB.prototype;
    // Check for conflicts:
    const commonKeys = Object.getOwnPropertyNames(aProto)
        .filter((key) => key !== "constructor" &&
        bProto.hasOwnProperty(key));
    if (commonKeys.length > 0) {
        throw new Error(`Conflicting members found: ${commonKeys.join(", ")}`);
    }
    class C {
        constructor() {
            Object.assign(this, new ClassA());
            Object.assign(this, new ClassB());
        }
    }
    const cProto = C.prototype;
    for (const proto of [aProto, bProto]) {
        for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
            cProto[key] = aProto[key];
            Object.defineProperty(cProto, key, descriptor);
        }
    }
    return C;
}
//# sourceMappingURL=polymorphism.js.map
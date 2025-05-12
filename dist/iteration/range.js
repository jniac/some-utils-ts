export function* range(count) {
    let i = 0;
    const out = {
        get i() { return i; },
        get t() { return i / count; },
        get count() { return count; },
    };
    for (; i < count; i++) {
        yield out;
    }
}
//# sourceMappingURL=range.js.map
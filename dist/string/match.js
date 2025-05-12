export function applyStringMatcher(str, matcher) {
    if (matcher === '*') {
        return true;
    }
    if (typeof matcher === 'string') {
        return matcher === str;
    }
    if (matcher instanceof RegExp) {
        return matcher.test(str);
    }
    if (typeof matcher === 'function') {
        return matcher(str);
    }
    return false;
}
//# sourceMappingURL=match.js.map
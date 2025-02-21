export function mapRecord(source, mapper) {
    return Object.fromEntries(Object
        .entries(source)
        .map(([key, value]) => mapper(key, value)));
}

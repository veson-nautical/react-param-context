export function makeMap<Row, Key, OutRow=Row>(data: Row[], keyFunc: (row: Row) => Key, valueFunc?: (row: Row) => OutRow) {
    const map = new Map<Key, OutRow[]>();
    for (const row of data) {
        const key = keyFunc(row);
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)!.push((valueFunc ? valueFunc(row) : row) as OutRow);
    }
    return map;
}

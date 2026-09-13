export function roleLabel(name = '') {
    return String(name)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function sameIdList(left = [], right = []) {
    if (left.length !== right.length) {
        return false;
    }

    const a = [...left].map(Number).sort((x, y) => x - y);
    const b = [...right].map(Number).sort((x, y) => x - y);

    return a.every((value, index) => value === b[index]);
}

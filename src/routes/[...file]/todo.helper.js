export function generateItemId(edititem) {
    const primitve_id = Array.from(edititem.description
        .normalize('NFKD')
        .toLocaleLowerCase()
        .replaceAll(/[:;<=>?@[\]^_`]/g, ''))
        .map(char => char.codePointAt(0))
        .filter(cp => (cp >= 48) && (cp <= 122) )
        .map(cp => String.fromCodePoint(cp))
        .slice(0, 32)
        .join('')
    return primitve_id
}

export function nowDate () {
    const now = new Date()
    return now.toLocaleDateString("de", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).split('.').reverse().join('-')
}
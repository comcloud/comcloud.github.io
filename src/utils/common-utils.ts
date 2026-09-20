export function slugify(input?: string) {
    if (!input) return '';

    // lower case, trim, and drop accents so "Café" and "cafe" land on the same tag
    var slug = input
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    // keep every script's letters and digits — Chinese tags must survive, unlike a plain [^a-z0-9] filter
    slug = slug.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim();

    slug = slug.replace(/[\s-]+/g, '-');

    return slug;
}

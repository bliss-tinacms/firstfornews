export type RefObject = { title?: string | null; name?: string | null; _sys?: { filename?: string | null } | null };

export function labelFromReference(reference: unknown, fallback = 'News') {
  if (!reference) return fallback;
  if (Array.isArray(reference)) {
    const labels = reference.map((item) => labelFromReference(item, '')).filter(Boolean);
    return labels.length ? labels.join(', ') : fallback;
  }
  if (typeof reference === 'string') {
    return reference.split('/').pop()?.replace(/\.(json|mdx?)$/i, '').replace(/[-_]+/g, ' ') || fallback;
  }
  if (typeof reference === 'object') {
    const item = reference as RefObject;
    return item.title || item.name || item._sys?.filename || fallback;
  }
  return fallback;
}

export function getAuthorName(reference: unknown, fallback = 'First For News Staff') {
  return labelFromReference(reference, fallback);
}

export function firstImage(post: any) {
  return post?.heroImage || '';
}

export function normalizeText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

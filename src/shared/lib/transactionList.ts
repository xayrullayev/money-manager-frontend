/** Preserve server ordering while eliminating overlap between cursor pages. */
export function mergePage<T extends { id: string }>(previous: T[], incoming: T[]): T[] {
  const seen = new Set(previous.map(item => item.id));
  return [...previous, ...incoming.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  })];
}

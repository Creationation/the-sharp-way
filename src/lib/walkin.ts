/** Extract walk-in client info stored in booking notes by the admin create sheet. */
export const parseWalkin = (notes?: string | null): { name: string; phone?: string } | null => {
  if (!notes) return null;
  const m = notes.match(/(?:Laufkundschaft|Walk-in):\s*([^·]+)/);
  if (!m) return null;
  const p = notes.match(/Tel:\s*([^·]+)/);
  return { name: m[1].trim(), phone: p?.[1].trim() };
};

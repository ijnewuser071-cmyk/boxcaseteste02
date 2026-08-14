const BRAZILIAN_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38", "41", "42", "43", "44", "45", "46", "47", "48",
  "49", "51", "53", "54", "55", "61", "62", "63", "64", "65", "66", "67", "68", "69", "71",
  "73", "74", "75", "77", "79", "81", "82", "83", "84", "85", "86", "87", "88", "89", "91",
  "92", "93", "94", "95", "96", "97", "98", "99",
]);

export function normalizeInternationalPhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) return `+${digits}`;
  if (trimmed.startsWith("00") && digits.length > 2) return `+${digits.slice(2)}`;
  if (digits.startsWith("55") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("32") && digits.length === 11) return `+${digits}`;

  if ((digits.length === 10 || digits.length === 11) && BRAZILIAN_DDDS.has(digits.slice(0, 2))) {
    return `+55${digits}`;
  }

  return `+${digits}`;
}

export function isPlausibleInternationalPhone(phone: string | null) {
  return Boolean(phone && /^\+[1-9]\d{7,14}$/.test(phone));
}

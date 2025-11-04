export const INVALID_NAME_PATTERNS = [
  /^none(\s+none)?$/i,
  /^null$/i,
  /^undefined$/i,
];

export function getDisplayNameFromParts(
  name?: string | null,
  email?: string | null,
): string {
  try {
    const raw = (name || "").toString().trim();
    const isInvalid =
      raw === "" || INVALID_NAME_PATTERNS.some((re) => re.test(raw));
    if (!isInvalid) return raw;

    // fallback to the email local-part
    const local = (email || "").toString().split("@")[0] || "unknown";
    return local;
  } catch (e) {
    return "unknown";
  }
}

// Accept objects with sender_name and sender_email (e.g. Message or raw ws message)
export function getDisplayName(
  obj: { sender_name?: any; sender_email?: any } | any,
) {
  if (!obj) return "unknown";
  return getDisplayNameFromParts(obj.sender_name, obj.sender_email);
}

export default getDisplayName;

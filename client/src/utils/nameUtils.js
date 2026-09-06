// The registration dialog collects a single "שם מלא" field, but the
// existing /api/auth/register endpoint (see server/services/authService.js)
// requires firstName + lastName separately in order to build fullName.
// This splits on the first space; a one-word name is duplicated into both
// fields so backend validation (each part >= 2 characters) still passes.
export function splitFullName(fullName) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const firstSpaceIndex = trimmed.indexOf(" ");

  if (firstSpaceIndex === -1) {
    return { firstName: trimmed, lastName: trimmed };
  }

  return {
    firstName: trimmed.slice(0, firstSpaceIndex),
    lastName: trimmed.slice(firstSpaceIndex + 1),
  };
}

export function splitFullName(fullName) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const firstSpaceIndex = trimmed.indexOf(" ");

  // Keep a missing last name empty so validation can reject it. Duplicating
  // the first name here would store invented data and bypass the name policy.
  if (firstSpaceIndex === -1) {
    return { firstName: trimmed, lastName: "" };
  }

  return {
    firstName: trimmed.slice(0, firstSpaceIndex),
    lastName: trimmed.slice(firstSpaceIndex + 1),
  };
}

export function isValidFullName(fullName) {
  if (typeof fullName !== "string") return false;

  const { firstName, lastName } = splitFullName(fullName);
  return firstName.length >= 2 && lastName.length >= 2 && fullName.trim().length <= 100;
}

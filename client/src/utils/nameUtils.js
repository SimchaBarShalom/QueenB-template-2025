export function splitFullName(fullName) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const firstSpaceIndex = trimmed.indexOf(" ");

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

// Single source of truth for the password rules shown live in the
// registration dialog (PasswordRequirements) and enforced before submit.
export const PASSWORD_RULES = [
  { key: "minLength", label: "8 תווים לפחות", test: (password) => password.length >= 8 },
  { key: "upper", label: "אות גדולה", test: (password) => /[A-Z]/.test(password) },
  { key: "lower", label: "אות קטנה", test: (password) => /[a-z]/.test(password) },
  { key: "number", label: "מספר", test: (password) => /[0-9]/.test(password) },
  { key: "special", label: "תו מיוחד", test: (password) => /[^A-Za-z0-9]/.test(password) },
];

export function getPasswordChecks(password = "") {
  return PASSWORD_RULES.reduce((checks, rule) => {
    checks[rule.key] = rule.test(password);
    return checks;
  }, {});
}

export function isPasswordValid(password = "") {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

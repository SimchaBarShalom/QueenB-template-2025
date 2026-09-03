function isValidPassword(password) {
  return typeof password === "string" && /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });
  return missing;
}

module.exports = {
  isValidPassword,
  requireFields,
};

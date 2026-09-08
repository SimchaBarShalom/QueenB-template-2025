const { sendEmail } = require("./emailService");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_RECIPIENT = "queenmatch.team@gmail.com";

function validateContactInput(input = {}) {
  const errors = [];
  for (const field of ["name", "email", "subject", "message"]) {
    if (typeof input[field] !== "string" || !input[field].trim()) errors.push(`${field} is required`);
  }
  if (input.email && (typeof input.email !== "string" || !EMAIL_PATTERN.test(input.email.trim()))) {
    errors.push("A valid email is required");
  }
  if (typeof input.name === "string" && input.name.trim().length > 100) errors.push("Name is too long");
  if (typeof input.email === "string" && input.email.trim().length > 254) errors.push("Email is too long");
  if (typeof input.subject === "string" && input.subject.trim().length > 200) errors.push("Subject is too long");
  if (typeof input.message === "string" && (input.message.trim().length < 2 || input.message.trim().length > 5000)) errors.push("Message must be between 2 and 5000 characters");
  return errors;
}

async function sendContactMessage(input) {
  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();
  await sendEmail({
    to: CONTACT_RECIPIENT,
    replyTo: email,
    subject: `[Queen Match contact] ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><hr /><p>${message.replace(/\n/g, "<br />")}</p>`,
  });
}

module.exports = { CONTACT_RECIPIENT, sendContactMessage, validateContactInput };

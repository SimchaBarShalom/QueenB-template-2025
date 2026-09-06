const nodemailer = require("nodemailer");

// יוצרים חיבור לחשבון ה-Gmail של המערכת.
// הפרטים נלקחים מקובץ .env כדי שלא יהיו כתובים ישירות בקוד.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// פונקציה כללית לשליחת מייל.
// אפשר להעביר לה נמען, נושא, טקסט רגיל ו-HTML.
async function sendEmail({ to, subject, text, html }) {
  return transporter.sendMail({
    // זה השם והכתובת שיופיעו כשולח של המייל.
    from: `"Queen Match" <${process.env.SMTP_USER}>`,

    // כתובת המייל של הנמען.
    to,

    // נושא המייל.
    subject,

    // תוכן טקסטואלי פשוט.
    text,

    // תוכן HTML מעוצב, אם נרצה להשתמש בו.
    html,
  });
}

// פונקציה לבדיקה שהחיבור ל-Gmail עובד
// ושה-SMTP_USER וה-SMTP_PASSWORD תקינים.
async function verifyEmailConnection() {
  return transporter.verify();
}

// מייצאים את הפונקציות כדי שנוכל להשתמש בהן
// בשירותים אחרים של השרת, למשל mentoringRequestsService.
module.exports = {
  sendEmail,
  verifyEmailConnection,
};
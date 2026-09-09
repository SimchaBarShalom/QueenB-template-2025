let transporter;

function getTransporter() {
  if (!transporter) {
    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

// פונקציה כללית לשליחת מייל.
// אפשר להעביר לה נמען, נושא, טקסט רגיל ו-HTML.
async function sendEmail({ to, subject, text, html, replyTo }) {
  return getTransporter().sendMail({
    // זה השם והכתובת שיופיעו כשולח של המייל.
    from: `"Queen Match" <${process.env.SMTP_USER}>`,

    // כתובת המייל של הנמען.
    to,
    replyTo,

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
  return getTransporter().verify();
}

function formatMeetingDate(date) {
  return new Date(date).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" });
}

function formatMeetingTime(date) {
  return new Date(date).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
}

// שלושת הפונקציות הבאות בונות ושולחות את מיילי הפגישות בפועל.
// ה-worker של תור המיילים הוא היחיד שקורא להן; שירות הפגישות רק מכניס
// job עם המידע הדרוש לתור.
async function sendMeetingScheduledMentorEmail({ to, mentorName, menteeName, scheduledStart, scheduledEnd }) {
  const meetingDate = formatMeetingDate(scheduledStart);
  const startTime = formatMeetingTime(scheduledStart);
  const endTime = formatMeetingTime(scheduledEnd);

  return sendEmail({
    to,
    subject: "נקבעה פגישה חדשה ב-Queen Match",
    text: `
היי ${mentorName},

${menteeName} בחרה מועד לפגישה, והפגישה נקבעה בהצלחה.

תאריך הפגישה: ${meetingDate}
שעת התחלה: ${startTime}
שעת סיום: ${endTime}

צוות Queen Match
        `,
    html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>נקבעה פגישה חדשה 🎉</h2>
            <p>היי ${mentorName},</p>
            <p><strong>${menteeName}</strong> בחרה מועד לפגישה, והפגישה נקבעה בהצלחה.</p>
            <p>
              <strong>תאריך הפגישה:</strong> ${meetingDate}<br />
              <strong>שעת התחלה:</strong> ${startTime}<br />
              <strong>שעת סיום:</strong> ${endTime}
            </p>
            <p>צוות Queen Match</p>
          </div>
        `,
  });
}

async function sendMeetingScheduledMenteeEmail({ to, mentorName, menteeName, scheduledStart, scheduledEnd }) {
  const meetingDate = formatMeetingDate(scheduledStart);
  const startTime = formatMeetingTime(scheduledStart);
  const endTime = formatMeetingTime(scheduledEnd);

  return sendEmail({
    to,
    subject: "הפגישה שלך נקבעה ב-Queen Match",
    text: `
היי ${menteeName},

הפגישה שלך עם ${mentorName} נקבעה בהצלחה.

תאריך הפגישה: ${meetingDate}
שעת התחלה: ${startTime}
שעת סיום: ${endTime}

צוות Queen Match
        `,
    html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>הפגישה שלך נקבעה 🎉</h2>
            <p>היי ${menteeName},</p>
            <p>הפגישה שלך עם <strong>${mentorName}</strong> נקבעה בהצלחה.</p>
            <p>
              <strong>תאריך הפגישה:</strong> ${meetingDate}<br />
              <strong>שעת התחלה:</strong> ${startTime}<br />
              <strong>שעת סיום:</strong> ${endTime}
            </p>
            <p>צוות Queen Match</p>
          </div>
        `,
  });
}

async function sendMeetingCancelledEmail({ to, menteeName, mentorName, scheduledStart }) {
  const date = formatMeetingDate(scheduledStart);
  const time = formatMeetingTime(scheduledStart);

  return sendEmail({
    to,
    subject: "הפגישה בוטלה | Queen Match",
    text: `היי ${menteeName},\n\n${mentorName} ביטלה את הפגישה שלכם.\nתאריך: ${date}\nשעה: ${time}\n\nצוות Queen Match`,
    html: `<div dir="rtl"><p>היי ${menteeName},</p><p><strong>${mentorName}</strong> ביטלה את הפגישה שלכם.</p><p>תאריך: ${date}<br />שעה: ${time}</p><p>צוות Queen Match</p></div>`,
  });
}

// מייצאים את הפונקציות כדי שנוכל להשתמש בהן
// בשירותים אחרים של השרת, למשל mentoringRequestsService.
module.exports = {
  sendEmail,
  verifyEmailConnection,
  sendMeetingScheduledMentorEmail,
  sendMeetingScheduledMenteeEmail,
  sendMeetingCancelledEmail,
};

const prisma = require("../lib/prisma");
const { sendEmail } = require("./emailService");

// ============================================================
// שליחת מיילים למנטורית ולחניכה לאחר שהחניכה בחרה מועד
// ונקבעה פגישה.
//
// שולחים את שני המיילים במקביל עם Promise.allSettled,
// כדי שכישלון של מייל אחד לא ימנע את שליחת השני,
// ובעיקר - לא יבטל את ה-Meeting שכבר נוצר ב-Database.
// אם מייל כלשהו נכשל, רק מדפיסים שגיאה ל-console.
// ============================================================
async function sendMeetingScheduledEmails({
  mentor,
  mentee,
  meeting,
}) {
  try {
    // כל הנתונים (תאריך ושעות) מגיעים מה-Meeting שנוצר בפועל,
    // ולא כתובים ידנית, ומוצגים לפי אזור הזמן של ישראל.
    const meetingDate = new Date(
      meeting.scheduledStart
    ).toLocaleDateString("he-IL", {
      timeZone: "Asia/Jerusalem",
    });

    const startTime = new Date(
      meeting.scheduledStart
    ).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jerusalem",
    });

    const endTime = new Date(
      meeting.scheduledEnd
    ).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jerusalem",
    });

    // שני מיילים - למנטורית ולחניכה - נשלחים במקביל.
    const emailResults = await Promise.allSettled([
      // מייל למנטורית.
      // הכתובת נשלפת מ-request.mentorProfile.user.email,
      // ולא כתובת קבועה או SMTP_USER.
      sendEmail({
        to: mentor.email,
        subject: "נקבעה פגישה חדשה ב-Queen Match",
        text: `
היי ${mentor.fullName},

${mentee.fullName} בחרה מועד לפגישה, והפגישה נקבעה בהצלחה.

תאריך הפגישה: ${meetingDate}
שעת התחלה: ${startTime}
שעת סיום: ${endTime}

צוות Queen Match
        `,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>נקבעה פגישה חדשה 🎉</h2>

            <p>היי ${mentor.fullName},</p>

            <p>
              <strong>${mentee.fullName}</strong>
              בחרה מועד לפגישה, והפגישה נקבעה בהצלחה.
            </p>

            <p>
              <strong>תאריך הפגישה:</strong> ${meetingDate}<br />
              <strong>שעת התחלה:</strong> ${startTime}<br />
              <strong>שעת סיום:</strong> ${endTime}
            </p>

            <p>צוות Queen Match</p>
          </div>
        `,
      }),

      // מייל לחניכה.
      // הכתובת נשלפת מ-request.mentee.email,
      // ולא כתובת קבועה או SMTP_USER.
      sendEmail({
        to: mentee.email,
        subject: "הפגישה שלך נקבעה ב-Queen Match",
        text: `
היי ${mentee.fullName},

הפגישה שלך עם ${mentor.fullName} נקבעה בהצלחה.

תאריך הפגישה: ${meetingDate}
שעת התחלה: ${startTime}
שעת סיום: ${endTime}

צוות Queen Match
        `,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>הפגישה שלך נקבעה 🎉</h2>

            <p>היי ${mentee.fullName},</p>

            <p>
              הפגישה שלך עם
              <strong>${mentor.fullName}</strong>
              נקבעה בהצלחה.
            </p>

            <p>
              <strong>תאריך הפגישה:</strong> ${meetingDate}<br />
              <strong>שעת התחלה:</strong> ${startTime}<br />
              <strong>שעת סיום:</strong> ${endTime}
            </p>

            <p>צוות Queen Match</p>
          </div>
        `,
      }),
    ]);

    // אם אחד המיילים נכשל, רק מדפיסים שגיאה ל-console.
    // ה-Meeting שכבר נוצר לא מתבטל בגלל זה.
    emailResults.forEach((result, index) => {
      if (result.status === "rejected") {
        const recipient =
          index === 0 ? "למנטורית" : "לחניכה";

        console.error(
          `שליחת המייל ${recipient} על קביעת הפגישה נכשלה:`,
          result.reason
        );
      }
    });
  } catch (error) {
    // גם כאן לא זורקים את השגיאה הלאה,
    // כדי שכשל במייל לא יבטל פגישה שכבר נוצרה.
    console.error(
      "שגיאה בשליחת מיילים על קביעת הפגישה:",
      error
    );
  }
}

// ============================================================
// יצירת פגישה לאחר שהחניכה בחרה מועד שהמנטורית הציעה.
// ============================================================
async function createMeetingFromSlot({
  requestId,
  slotId,
  menteeId,
}) {
  // מחפשים את המועד שהחניכה בחרה.
  // יחד איתו אנחנו שולפים גם את סבב התזמון,
  // את בקשת המנטורינג שאליה המועד שייך,
  // ואת פרטי החניכה והמנטורית (relations קיימים)
  // כדי שנוכל לשלוח מייל בסוף בלי שאילתה נוספת.
  const slot = await prisma.offeredSlot.findUnique({
    where: {
      id: Number(slotId),
    },

    include: {
      schedulingRound: {
        include: {
          request: {
            include: {
              mentee: true,

              mentorProfile: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // אם המועד לא נמצא - אי אפשר ליצור פגישה.
  if (!slot) {
    throw new Error("Selected slot was not found");
  }

  // הבקשה שאליה המועד שייך.
  const request = slot.schedulingRound.request;

  // מוודאים שהמועד באמת שייך לבקשה
  // שהחניכה מנסה לקבוע עבורה פגישה.
  if (request.id !== Number(requestId)) {
    throw new Error(
      "Selected slot does not belong to this mentoring request"
    );
  }

  // מוודאים שהבקשה באמת שייכת לחניכה הנוכחית.
  if (request.menteeId !== Number(menteeId)) {
    throw new Error(
      "This mentoring request does not belong to this mentee"
    );
  }

  // אפשר לבחור מועד רק כאשר המנטורית כבר הציעה מועדים
  // והמערכת מחכה לבחירת החניכה.
  if (
    request.status !==
    "WAITING_FOR_MENTEE_SELECTION"
  ) {
    throw new Error(
      "Mentoring request is not waiting for mentee selection"
    );
  }
  // בודקים האם לחניכה כבר קיימת פגישה פעילה.
const activeMeeting = await prisma.meeting.findFirst({
  where: {
    status: {
      in: [
        "SCHEDULED",
        "ATTENDANCE_CONFIRMED",
      ],
    },
    request: {
      is: {
        menteeId: Number(menteeId),
      },
    },
  },
});


// אם כבר קיימת פגישה פעילה,
// לא מאפשרים ליצור פגישה נוספת.
if (activeMeeting) {
  throw new Error(
    "יש לך כבר פגישה פעילה. כדי לקבוע פגישה חדשה, בטלי קודם את הפגישה הקיימת."
  );
}

  // מחפשים את ניסיון הפגישה האחרון עבור הבקשה.
  // זה חשוב כי בעתיד יכולה להיות פגישה שנקבעה מחדש.
  const lastMeeting =
    await prisma.meeting.findFirst({
      where: {
        requestId: Number(requestId),
      },

      orderBy: {
        attemptNumber: "desc",
      },
    });

  // אם עדיין לא הייתה פגישה - זה ניסיון מספר 1.
  // אחרת מעלים את המספר באחד.
  const attemptNumber = lastMeeting
    ? lastMeeting.attemptNumber + 1
    : 1;

  // משתמשים ב-transaction כדי ששתי הפעולות
  // יקרו ביחד:
  //
  // 1. יצירת Meeting.
  // 2. שינוי הבקשה ל-MATCHED.
  //
  // אם אחת מהפעולות נכשלת,
  // גם הפעולה השנייה לא תישמר.
  const result = await prisma.$transaction(
    async (tx) => {
      // יצירת הפגישה בפועל.
      const meeting = await tx.meeting.create({
        data: {
          requestId: Number(requestId),

          // המועד שהחניכה בחרה.
          selectedSlotId: Number(slotId),

          // מספר ניסיון הפגישה.
          attemptNumber,

          // התאריך והשעה מגיעים מהמועד
          // שהמנטורית הציעה.
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,

          // הפגישה כרגע מתוזמנת.
          status: "SCHEDULED",
        },
      });

      // ברגע שנוצרה פגישה אמיתית,
      // הבקשה הופכת ל-MATCHED.
      await tx.mentoringRequest.update({
        where: {
          id: Number(requestId),
        },

        data: {
          status: "MATCHED",
        },
      });

      return meeting;
    }
  );

  // אחרי שהפגישה נוצרה בהצלחה והבקשה עודכנה ל-MATCHED,
  // שולחים מייל למנטורית ולחניכה שהפגישה נקבעה.
  // request.mentee ו-request.mentorProfile.user כבר נשלפו למעלה,
  // כך שאין כאן שאילתה נוספת ואין email כפול שנשמר על ה-Meeting עצמו.
  await sendMeetingScheduledEmails({
    mentor: request.mentorProfile.user,
    mentee: request.mentee,
    meeting: result,
  });

  return result;
}

// ============================================================
// ביטול פגישה שכבר נקבעה.
// ============================================================
async function cancelMeeting({
  meetingId,
  menteeId,
}) {
  // קודם מחפשים את הפגישה ומוודאים:
  //
  // 1. שהפגישה קיימת.
  // 2. שהיא שייכת לחניכה שמנסה לבטל אותה.
  // 3. שהפגישה עדיין במצב שבו אפשר לבטל אותה.
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: Number(meetingId),

      status: {
        in: [
          "SCHEDULED",
          "ATTENDANCE_CONFIRMED",
        ],
      },

      request: {
        is: {
          menteeId: Number(menteeId),
        },
      },
    },

    include: {
      request: true,
    },
  });

  // אם לא נמצאה פגישה מתאימה,
  // לא מאפשרים את הביטול.
  if (!meeting) {
    throw new Error(
      "Meeting cannot be cancelled"
    );
  }

  // גם כאן משתמשים ב-transaction.
  //
  // הפגישה עצמה הופכת ל-CANCELLED
  // וגם תהליך המנטורינג נסגר כרגע כ-CANCELLED.
  const cancelledMeeting =
    await prisma.$transaction(async (tx) => {
      // ביטול הפגישה.
      const updatedMeeting =
        await tx.meeting.update({
          where: {
            id: Number(meetingId),
          },

          data: {
            status: "CANCELLED",
          },
        });

      // עדכון בקשת המנטורינג.
      await tx.mentoringRequest.update({
        where: {
          id: meeting.requestId,
        },

        data: {
          status: "CANCELLED",
        },
      });

      return updatedMeeting;
    });

  return cancelledMeeting;
}

module.exports = {
  createMeetingFromSlot,
  cancelMeeting,
};
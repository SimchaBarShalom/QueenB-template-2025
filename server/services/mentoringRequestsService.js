const prisma = require("../lib/prisma");
const { sendEmail } = require("./emailService");

// שולח מייל לחניכה ולמנטורית לאחר יצירת בקשת מנטורינג.
// אם שליחת המייל נכשלת, הבקשה שכבר נשמרה ב-DB לא מתבטלת.
async function sendMentoringRequestEmails({
  menteeId,
  mentorProfileId,
}) {
  try {
    // שליפת פרטי החניכה מה-Database.
    const mentee = await prisma.user.findUnique({
      where: {
        id: Number(menteeId),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    // שליפת פרטי המנטורית והמשתמשת המקושרת אליה.
    const mentorProfile =
      await prisma.mentorProfile.findUnique({
        where: {
          id: Number(mentorProfileId),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          mentoringTopics: true,
        },
      });

    // אם מסיבה כלשהי אחת המשתמשות לא נמצאה,
    // לא ננסה לשלוח מייל.
    if (!mentee || !mentorProfile?.user) {
      console.error(
        "לא נמצאו פרטי החניכה או המנטורית לצורך שליחת המייל."
      );
      return;
    }

    const mentor = mentorProfile.user;

    // כרגע הבקשה עצמה לא שומרת נושא ספציפי שהחניכה בחרה,
    // לכן במייל נציג את תחומי המנטורינג של המנטורית.
    const mentoringTopics =
      mentorProfile.mentoringTopics?.length > 0
        ? mentorProfile.mentoringTopics
            .map((topic) => topic.name)
            .join(", ")
        : "לא צוין תחום ספציפי";

    // שולחים את שני המיילים במקביל.
    // Promise.allSettled מאפשר לבקשה להישאר תקינה גם אם מייל אחד נכשל.
    const emailResults = await Promise.allSettled([
      // מייל לחניכה.
      sendEmail({
        to: mentee.email,
        subject: "בקשת הפגישה שלך נשלחה | Queen Match",
        text: `
היי ${mentee.fullName},

בקשת הפגישה שלך עם ${mentor.fullName} נשלחה בהצלחה.

ברגע שהמנטורית תציע מועדים לפגישה, תקבלי עדכון ותוכלי לבחור את הזמן שמתאים לך.

בהצלחה,
צוות Queen Match
        `,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>הבקשה נשלחה בהצלחה 💗</h2>

            <p>היי ${mentee.fullName},</p>

            <p>
              בקשת הפגישה שלך עם
              <strong>${mentor.fullName}</strong>
              נשלחה בהצלחה.
            </p>

            <p>
              ברגע שהמנטורית תציע מועדים לפגישה,
              תקבלי עדכון ותוכלי לבחור את הזמן שמתאים לך.
            </p>

            <p>
              בהצלחה,<br />
              צוות Queen Match
            </p>
          </div>
        `,
      }),

      // מייל למנטורית.
      sendEmail({
        to: mentor.email,
        subject: `בקשת מנטורינג חדשה מ-${mentee.fullName} | Queen Match`,
        text: `
היי ${mentor.fullName},

קיבלת בקשת מנטורינג חדשה מ-${mentee.fullName}.

תחומי המנטורינג הרלוונטיים:
${mentoringTopics}

היכנסי לאזור המנטורית ב-Queen Match כדי לצפות בבקשה ולהציע מועדים לפגישה.

צוות Queen Match
        `,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>יש לך בקשת מנטורינג חדשה ✨</h2>

            <p>היי ${mentor.fullName},</p>

            <p>
              <strong>${mentee.fullName}</strong>
              שלחה אלייך בקשת מנטורינג חדשה.
            </p>

            <p>
              <strong>תחומי מנטורינג:</strong>
              ${mentoringTopics}
            </p>

            <p>
              היכנסי לאזור המנטורית ב-Queen Match
              כדי לצפות בבקשה ולהציע מועדים לפגישה.
            </p>

            <p>
              צוות Queen Match
            </p>
          </div>
        `,
      }),
    ]);

    // אם אחד המיילים נכשל, רק נרשום את השגיאה בשרת.
    // לא נבטל את בקשת המנטורינג שנוצרה ב-DB.
    emailResults.forEach((result, index) => {
      if (result.status === "rejected") {
        const recipient =
          index === 0 ? "לחניכה" : "למנטורית";

        console.error(
          `שליחת המייל ${recipient} נכשלה:`,
          result.reason
        );
      }
    });
  } catch (error) {
    // גם כאן לא זורקים את השגיאה הלאה,
    // כדי שכשל במייל לא ימחק או יבטל את הבקשה.
    console.error(
      "שגיאה בשליחת מיילים עבור בקשת המנטורינג:",
      error
    );
  }
}

async function createMentoringRequest({
  menteeId,
  mentorProfileId,
}) {
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
  // לא מאפשרים לשלוח בקשה לפגישה נוספת.
  if (activeMeeting) {
    throw new Error(
      "יש לך כבר פגישה פעילה. כדי לקבוע פגישה חדשה, בטלי קודם את הפגישה הקיימת."
    );
  }
  // קודם כל שומרים את הבקשה ב-Database.
  const request = await prisma.mentoringRequest.create({
    data: {
      menteeId: Number(menteeId),
      mentorProfileId: Number(mentorProfileId),
      status: "WAITING_FOR_MENTOR_SLOTS",
    },
  });

  // אחרי שהבקשה נשמרה בהצלחה,
  // שולחים מייל לחניכה ולמנטורית.
  await sendMentoringRequestEmails({
    menteeId,
    mentorProfileId,
  });

  return request;
}

async function getMentoringRequestsByMentee(menteeId) {
  const requests =
    await prisma.mentoringRequest.findMany({
      where: {
        menteeId: Number(menteeId),
      },

      include: {
        mentorProfile: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                jobTitle: true,
                workplace: true,
                profileImageUrl: true,
              },
            },

            mentoringTopics: true,
          },
        },

        schedulingRounds: {
          include: {
            offeredSlots: true,
          },
          orderBy: {
            roundNumber: "desc",
          },
        },

        meetings: {
          orderBy: {
            attemptNumber: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return requests;
}

async function cancelMentoringRequest({
  requestId,
  menteeId,
}) {
  const existingRequest =
    await prisma.mentoringRequest.findFirst({
      where: {
        id: Number(requestId),
        menteeId: Number(menteeId),
        status: {
          in: [
            "WAITING_FOR_MENTOR_SLOTS",
            "WAITING_FOR_MENTEE_SELECTION",
          ],
        },
      },
    });

  if (!existingRequest) {
    throw new Error(
      "Mentoring request cannot be cancelled"
    );
  }

  const cancelledRequest =
    await prisma.mentoringRequest.update({
      where: {
        id: Number(requestId),
      },

      data: {
        status: "CANCELLED",
      },
    });

  return cancelledRequest;
}

module.exports = {
  createMentoringRequest,
  getMentoringRequestsByMentee,
  cancelMentoringRequest,
};
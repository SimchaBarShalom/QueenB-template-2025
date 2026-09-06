// מייבאים את Express כדי שנוכל ליצור Routes ל-API.
const express = require("express");

// יוצרים Router חדש.
// כל הכתובות שקשורות לפגישות יעברו דרך ה-Router הזה.
const router = express.Router();

// מייבאים מה-Service את הפונקציות
// שמבצעות את הלוגיקה האמיתית מול ה-Database.
const {
  createMeetingFromSlot,
  cancelMeeting,
} = require("../services/meetingsService");


// ============================================================
// בחירת מועד ויצירת פגישה
// ============================================================
//
// ה-Frontend ישלח:
//
// POST /api/meetings/select-slot
//
// וב-body:
// {
//   requestId,
//   slotId,
//   menteeId
// }
//
// הפונקציה הזאת רק מקבלת את הבקשה מה-Frontend
// ומעבירה את הנתונים ל-Service.
//
router.post("/select-slot", async (req, res) => {
  try {
    // שולפים מה-body את הנתונים שה-Frontend שלח.
    const {
      requestId,
      slotId,
      menteeId,
    } = req.body;

    // קוראים לפונקציה מה-Service.
    // היא זו שבודקת את הנתונים,
    // יוצרת Meeting ב-Database
    // ומשנה את MentoringRequest ל-MATCHED.
    const meeting =
      await createMeetingFromSlot({
        requestId,
        slotId,
        menteeId,
      });

    // אם הכול הצליח,
    // מחזירים ל-Frontend את הפגישה שנוצרה.
    //
    // 201 = נוצר משאב חדש בהצלחה.
    res.status(201).json(meeting);

  } catch (error) {
    // אם הייתה שגיאה,
    // מדפיסים אותה בטרמינל של השרת.
    console.error(
      "Error creating meeting:",
      error
    );

    // מחזירים ל-Frontend הודעת שגיאה.
    res.status(400).json({
      error: error.message,
    });
  }
});


// ============================================================
// ביטול פגישה
// ============================================================
//
// ה-Frontend ישלח:
//
// PATCH /api/meetings/:meetingId/cancel
//
// לדוגמה:
// PATCH /api/meetings/5/cancel
//
// וב-body:
// {
//   menteeId
// }
//
router.patch(
  "/:meetingId/cancel",
  async (req, res) => {
    try {
      // meetingId מגיע מתוך כתובת ה-URL.
      const { meetingId } = req.params;

      // menteeId מגיע מתוך ה-body.
      const { menteeId } = req.body;

      // קוראים לפונקציה מה-Service
      // שמבצעת את ביטול הפגישה ב-Database.
      const meeting = await cancelMeeting({
        meetingId,
        menteeId,
      });

      // מחזירים ל-Frontend את הפגישה המעודכנת.
      res.json(meeting);

    } catch (error) {
      // אם הביטול נכשל,
      // מציגים את השגיאה בטרמינל.
      console.error(
        "Error cancelling meeting:",
        error
      );

      // ומחזירים הודעת שגיאה ל-Frontend.
      res.status(400).json({
        error: error.message,
      });
    }
  }
);


// מייצאים את ה-Router,
// כדי ש-server/index.js יוכל להשתמש בו.
module.exports = router;
import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { queenbColors } from "../theme";


// ============================================================
// מעטפת משותפת לכל כרטיסי הפגישות.
//
// במקום לכתוב שוב Card עם אותו עיצוב בכל כרטיס,
// כל הכרטיסים משתמשים ב-CardShell.
// ============================================================
function CardShell({ children }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        borderColor: "#f6d3e0",
      }}
    >
      <Stack spacing={1.2}>
        {children}
      </Stack>
    </Card>
  );
}


// ============================================================
// שורה משותפת להצגת מידע משני,
// לדוגמה תאריך ושעת הפגישה.
// ============================================================
function InfoRow({ children }) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
    >
      {children}
    </Typography>
  );
}


// ============================================================
// פונקציית עזר להצגת תאריך של מועד.
//
// לדוגמה:
// 2026-09-07T12:00:00
//
// יוצג:
// 07.09.2026
// ============================================================
function formatSlotDate(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleDateString(
    "he-IL"
  );
}


// ============================================================
// פונקציית עזר להצגת שעה של מועד.
//
// לדוגמה:
// 2026-09-07T12:00:00
//
// יוצג:
// 15:00
//
// השעה מוצגת לפי אזור הזמן המקומי של הדפדפן.
// ============================================================
function formatSlotTime(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleTimeString(
    "he-IL",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


// ============================================================
// כרטיס של פגישה שכבר התקיימה.
//
// הכרטיס מציג:
// - שם המנטורית.
// - תאריך ושעה.
// - משך הפגישה.
// - תחום המנטורינג.
// - האם החניכה כבר מילאה משוב.
// ============================================================
export function CompletedMeetingCard({
  meeting,
  onAddFeedback,
}) {
  return (
    <CardShell>
      {/* שם המנטורית */}
      <Typography
        variant="h6"
        component="h3"
      >
        {meeting.mentorName}
      </Typography>

      {/* פרטי הפגישה */}
      <InfoRow>
        {meeting.date} | {meeting.time} |{" "}
        {meeting.durationMinutes} דקות
      </InfoRow>

      {/* תחום המנטורינג */}
      <Typography sx={{ fontWeight: 600 }}>
        {meeting.topic}
      </Typography>

      {/* אזור המשוב */}
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1.5}
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        justifyContent="space-between"
        sx={{
          mt: 1,
          pt: 1.5,
          borderTop: "1px solid #f6d3e0",
        }}
      >
        {meeting.feedbackSubmitted ? (
          // אם המשוב כבר הוגש,
          // מציגים סימון ירוק.
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
          >
            <CheckCircleIcon
              sx={{
                fontSize: 18,
                color: "success.main",
              }}
            />

            <Typography
              variant="body2"
              sx={{
                color: "success.main",
                fontWeight: 700,
              }}
            >
              המשוב הוגש
            </Typography>
          </Stack>
        ) : (
          // אם עדיין לא הוגש משוב,
          // מציגים סטטוס וכפתור להוספת משוב.
          <>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
            >
              <RadioButtonUncheckedIcon
                sx={{
                  fontSize: 18,
                  color: "text.disabled",
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                טרם הוגש משוב
              </Typography>
            </Stack>

            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                onAddFeedback(meeting)
              }
              sx={{
                borderRadius: 999,
              }}
            >
              הוספת משוב
            </Button>
          </>
        )}
      </Stack>
    </CardShell>
  );
}


// ============================================================
// כרטיס של פגישה שכבר נקבעה.
//
// הכרטיס מציג:
// - שם המנטורית.
// - תאריך ושעת התחלה וסיום.
// - תחום המנטורינג.
// - שינוי מועד.
// - ביטול פגישה.
// ============================================================
export function ScheduledMeetingCard({
  meeting,
  onReschedule,
  onCancel,
}) {
  return (
    <CardShell>
      {/* שם המנטורית */}
      <Typography
        variant="h6"
        component="h3"
      >
        {meeting.mentorName}
      </Typography>

      {/* תאריך ושעות הפגישה */}
      <InfoRow>
        {meeting.date} | {meeting.startTime} |{" "}
        {meeting.endTime}
      </InfoRow>

      {/* תחום המנטורינג */}
      <Typography sx={{ fontWeight: 600 }}>
        {meeting.topic}
      </Typography>

      {/* פעולות על הפגישה */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          mt: 1,
        }}
      >
        {/* שינוי מועד עדיין לא מחובר לשרת */}
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            onReschedule(meeting)
          }
          sx={{
            borderRadius: 999,
          }}
        >
          שינוי מועד
        </Button>

        {/* ביטול פגישה */}
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={() => onCancel(meeting)}
          sx={{
            borderRadius: 999,
          }}
        >
          ביטול פגישה
        </Button>
      </Stack>
    </CardShell>
  );
}


// ============================================================
// כרטיס של בקשה שבה החניכה עדיין מחכה
// שהמנטורית תציע לה מועדים.
//
// כלומר:
// MentoringRequest.status = WAITING_FOR_MENTOR_SLOTS
// ============================================================
export function PendingSlotsMeetingCard({
  request,
  onCancel,
}) {
  return (
    <CardShell>
      {/* שם המנטורית */}
      <Typography
        variant="h6"
        component="h3"
      >
        {request.mentorName}
      </Typography>

      {/* מתי הבקשה נשלחה */}
      <InfoRow>
        תאריך הבקשה: {request.requestDate}
      </InfoRow>

      {/* תחום המנטורינג */}
      <Typography sx={{ fontWeight: 600 }}>
        {request.topic}
      </Typography>

      {/* סטטוס הבקשה */}
      <Box
        sx={{
          alignSelf: "flex-start",
          bgcolor: queenbColors.pinkPale,
          color: queenbColors.pink,
          fontWeight: 700,
          fontSize: 13,
          borderRadius: 999,
          px: 1.5,
          py: 0.5,
        }}
      >
        ממתינה להצעת זמנים
      </Box>

      {/* אפשרות לבטל את הבקשה */}
      <Button
        size="small"
        variant="text"
        color="error"
        onClick={() => onCancel(request)}
        sx={{
          borderRadius: 999,
          alignSelf: "flex-start",
        }}
      >
        ביטול הבקשה
      </Button>
    </CardShell>
  );
}


// ============================================================
// כרטיס של בקשה שבה המנטורית כבר הציעה מועדים,
// ועכשיו החניכה צריכה לבחור אחד מהם.
//
// כלומר:
// MentoringRequest.status = WAITING_FOR_MENTEE_SELECTION
// ============================================================
export function SlotsToChooseMeetingCard({
  request,
  onChooseTime,
  onCancel,

  // true כאשר החניכה רגע קבעה פגישה על הבקשה הזו בהצלחה.
  // מציג הודעת הצלחה ומשבית את כפתור "בחירת מועד"
  // כדי למנוע לחיצה כפולה, עד שהכרטיס יעבור
  // ל"פגישות שנקבעו" אחרי loadRequests.
  justScheduled = false,
}) {
  // ==========================================================
  // שומרים את ה-ID של המועד שהחניכה בחרה.
  //
  // בהתחלה אין מועד נבחר ולכן הערך הוא null.
  // ==========================================================
  const [selectedSlotId, setSelectedSlotId] =
    useState(null);


  // ==========================================================
  // המועדים שהגיעו מה-Backend.
  //
  // אם אין מועדים מסיבה כלשהי,
  // משתמשים במערך ריק כדי למנוע שגיאה.
  // ==========================================================
  const slots = request.slots || [];


  // ==========================================================
  // מוצאים מתוך מערך המועדים
  // את המועד שהחניכה בחרה.
  // ==========================================================
  const selectedSlot = slots.find(
    (slot) => slot.id === selectedSlotId
  );


  return (
    <CardShell>
      {/* שם המנטורית */}
      <Typography
        variant="h6"
        component="h3"
      >
        {request.mentorName}
      </Typography>

      {/* תחום המנטורינג */}
      <Typography sx={{ fontWeight: 600 }}>
        {request.topic}
      </Typography>

      {/* תאריך שליחת הבקשה ותאריך המענה */}
      <InfoRow>
        תאריך הבקשה: {request.requestDate} |{" "}
        תאריך המענה: {request.respondedDate}
      </InfoRow>


      {/* ======================================================
          המועדים שהמנטורית הציעה
      ====================================================== */}
      <Box sx={{ mt: 1 }}>
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            fontWeight: 700,
          }}
        >
          בחרי מועד:
        </Typography>


        {slots.length === 0 ? (
          // אם משום מה אין מועדים,
          // מציגים הודעה במקום כפתורים ריקים.
          <Typography
            variant="body2"
            color="text.secondary"
          >
            לא נמצאו מועדים לבחירה.
          </Typography>
        ) : (
          // אם קיימים מועדים,
          // מציגים כל אחד מהם ככפתור.
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            rowGap={1}
          >
            {slots.map((slot) => {
              // האם זה המועד שהחניכה סימנה כרגע.
              const isSelected =
                selectedSlotId === slot.id;

              return (
                <Button
                  key={slot.id}
                  type="button"

                  // אם לוחצים על המועד,
                  // שומרים את ה-ID שלו ב-state.
                  onClick={() =>
                    setSelectedSlotId(slot.id)
                  }

                  // המועד הנבחר מופיע מלא,
                  // ושאר המועדים מופיעים עם מסגרת.
                  variant={
                    isSelected
                      ? "contained"
                      : "outlined"
                  }

                  size="small"

                  sx={{
                    borderRadius: 999,
                  }}
                >
                  {formatSlotDate(
                    slot.startTime
                  )}
                  {" | "}
                  {formatSlotTime(
                    slot.startTime
                  )}
                  {" - "}
                  {formatSlotTime(slot.endTime)}
                </Button>
              );
            })}
          </Stack>
        )}
      </Box>


      {/* ======================================================
          כפתורי הפעולה
      ====================================================== */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          mt: 1,
        }}
      >
        {/* אישור המועד שנבחר */}
        <Button
          size="small"
          variant="contained"

          // אי אפשר לאשר לפני שהחניכה בחרה מועד,
          // וגם לא בזמן שהודעת ההצלחה מוצגת -
          // כדי למנוע לחיצה כפולה על אותה פגישה.
          disabled={!selectedSlot || justScheduled}

          // שולחים הלאה גם את הבקשה
          // וגם את המועד שהחניכה בחרה.
          onClick={() =>
            onChooseTime(
              request,
              selectedSlot
            )
          }

          sx={{
            borderRadius: 999,
          }}
        >
          בחירת מועד
        </Button>


        {/* ביטול בקשת המנטורינג */}
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={() => onCancel(request)}
          sx={{
            borderRadius: 999,
          }}
        >
          ביטול הבקשה
        </Button>
      </Stack>

      {/* ======================================================
          הודעת הצלחה שמופיעה מיד אחרי שהפגישה נקבעה בהצלחה,
          במקום Popup. נעלמת אוטומטית כשהכרטיס עובר
          ל"פגישות שנקבעו" (אחרי loadRequests ב-Parent).
      ====================================================== */}
      {justScheduled && (
        <Alert severity="success">
          הפגישה נקבעה בהצלחה!
        </Alert>
      )}
    </CardShell>
  );
}
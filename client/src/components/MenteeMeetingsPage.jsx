import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { queenbColors } from "../theme";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import {
  CompletedMeetingCard,
  ScheduledMeetingCard,
  PendingSlotsMeetingCard,
  SlotsToChooseMeetingCard,
} from "./MeetingStatusCards";

import ComingSoonSnackbar from "./ComingSoonSnackbar";


// ============================================================
// הקטגוריות שמופיעות בסרגל העליון של עמוד הפגישות.
// ============================================================
const SECTION_TABS = [
  {
    id: "completed-section",
    label: "פגישות שהתקיימו",
  },
  {
    id: "scheduled-section",
    label: "פגישות שנקבעו",
  },
  {
    id: "waiting-mentor-section",
    label: "ממתינות להצעת זמנים",
  },
  {
    id: "waiting-mentee-section",
    label: "מחכות לבחירת מועד",
  },
];


// ============================================================
// פונקציית עזר להצגת תאריך בעברית.
// ============================================================
function formatDate(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleDateString(
    "he-IL"
  );
}


// ============================================================
// פונקציית עזר להצגת שעה.
// ============================================================
function formatTime(dateValue) {
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
// מחזירה את תחומי המנטורינג של המנטורית.
// ============================================================
function getTopic(request) {
  const topics =
    request.mentorProfile?.mentoringTopics || [];

  if (topics.length === 0) {
    return "מנטורינג";
  }

  return topics
    .map((topic) => topic.name)
    .join(", ");
}


// ============================================================
// מחזירה את שם המנטורית מתוך הבקשה.
// ============================================================
function getMentorName(request) {
  return (
    request.mentorProfile?.user?.fullName ||
    "מנטורית"
  );
}


// ============================================================
// עמוד הפגישות של החניכה.
// ============================================================
function MenteeMeetingsPage() {
  // כל בקשות המנטורינג של החניכה.
  const [requests, setRequests] = useState([]);

  // האם העמוד עדיין טוען נתונים.
  const [loading, setLoading] = useState(true);

  // הודעת שגיאה.
  const [error, setError] = useState("");

  // הודעה עבור פעולות שעדיין לא מחוברות לשרת.
  const [infoMessage, setInfoMessage] =
    useState("");

  // Popup גנרי שמוצג במרכז המסך בעקבות ניסיון לקבוע פגישה -
  // גם להודעת הצלחה וגם להודעת חסימה (למשל פגישה פעילה קיימת).
  // כך משתמשים באותו Dialog אחד בלי ליצור רכיב כפול.
  const [meetingDialog, setMeetingDialog] =
    useState({
      open: false,
      title: "",
      message: "",
      buttonLabel: "הבנתי",
    });

  // סוגר את ה-Popup הגנרי (בלחיצה על הכפתור או מחוץ לחלון).
  const closeMeetingDialog = () => {
    setMeetingDialog((current) => ({
      ...current,
      open: false,
    }));
  };

  // מזהה הבקשה שרגע נקבעה לה פגישה בהצלחה.
  // משמש להצגת הודעת הצלחה ירוקה בתוך הכרטיס המתאים בלבד,
  // ולא Popup.
  const [
    justScheduledRequestId,
    setJustScheduledRequestId,
  ] = useState(null);


  // ============================================================
  // המשתמשת המחוברת נשמרת ב-localStorage לאחר Login.
  // ============================================================
  const currentUser = JSON.parse(
    localStorage.getItem("queensMatchUser") ||
      "null"
  );

  // ה-ID של החניכה המחוברת.
  const menteeId = currentUser?.id;


  // ============================================================
  // טעינת כל הבקשות והפגישות של החניכה מהשרת.
  //
  // הפונקציה נמצאת במקום אחד בלבד כדי שלא נכתוב שוב
  // את אותו axios.get לאחר כל פעולה שמשנה את ה-DB.
  // ============================================================
  const loadRequests = useCallback(async () => {
    if (!menteeId) {
      setError("לא נמצאה משתמשת מחוברת.");
      setLoading(false);
      return;
    }

    try {
      // מנקים שגיאה קודמת.
      setError("");

      // מביאים את כל בקשות המנטורינג של החניכה.
      // בתוך כל בקשה מגיעים גם:
      // mentorProfile
      // schedulingRounds
      // offeredSlots
      // meetings
      const response = await axios.get(
        `/api/mentoring-requests/mentee/${menteeId}`
      );

      // שומרים את הנתונים שקיבלנו מהשרת.
      setRequests(response.data);
    } catch (requestError) {
      console.error(requestError);

      setError(
        "לא הצלחנו לטעון את הפגישות."
      );
    }
  }, [menteeId]);


  // ============================================================
  // כשהעמוד עולה בפעם הראשונה,
  // טוענים את הנתונים מהשרת.
  // ============================================================
  useEffect(() => {
    async function initializePage() {
      setLoading(true);

      await loadRequests();

      setLoading(false);
    }

    initializePage();
  }, [loadRequests]);


  // ============================================================
  // פונקציה זמנית לפיצ'רים שעוד לא חוברו לשרת.
  // ============================================================
  const notReady = () => {
    setInfoMessage(
      "הפעולה תתאפשר בקרוב - התכונה עדיין לא מחוברת לשרת."
    );
  };


  // ============================================================
  // ביטול בקשת מנטורינג שעדיין לא הפכה לפגישה.
  // ============================================================
  const handleCancelRequest = async (
    request
  ) => {
    try {
      // מנקים הודעת שגיאה קודמת.
      setError("");

      // מבטלים את הבקשה ב-Backend.
      await axios.patch(
        `/api/mentoring-requests/${request.id}/cancel`,
        {
          menteeId,
        }
      );

      // במקום לעדכן ידנית את ה-state,
      // טוענים מחדש את המידע ממקור האמת - ה-DB.
      await loadRequests();
    } catch (requestError) {
      console.error(requestError);

      setError("ביטול הבקשה נכשל.");
    }
  };


  // ============================================================
  // ביטול פגישה שכבר נקבעה.
  // ============================================================
  const handleCancelMeeting = async (
    meeting
  ) => {
    try {
      // מנקים הודעת שגיאה קודמת.
      setError("");

      // שולחים בקשת ביטול ל-Backend.
      await axios.patch(
        `/api/meetings/${meeting.id}/cancel`,
        {
          menteeId,
        }
      );

      // משתמשים באותה פונקציית טעינה בדיוק.
      // אין כאן axios.get כפול.
      await loadRequests();
    } catch (requestError) {
      console.error(requestError);

      setError("ביטול הפגישה נכשל.");
    }
  };


  // ============================================================
  // בחירת מועד פגישה מתוך המועדים שהמנטורית הציעה.
  //
  // request - בקשת המנטורינג שאליה שייך המועד.
  // selectedSlot - המועד (OfferedSlot) שהחניכה בחרה בכרטיס.
  // ============================================================
  const handleChooseTime = async (
    request,
    selectedSlot
  ) => {
    try {
      // מנקים הודעת שגיאה קודמת.
      setError("");

      // שולחים ל-Backend את הבקשה, המועד שנבחר ואת החניכה.
      // ה-Endpoint הזה כבר קיים ומטפל בכל הבדיקות
      // וביצירת ה-Meeting בפועל.
      await axios.post(
        "/api/meetings/select-slot",
        {
          requestId: request.id,
          slotId: selectedSlot.id,
          menteeId,
        }
      );

      // במקום Popup, מציגים הודעת הצלחה בתוך הכרטיס עצמו.
      // שומרים איזו בקשה בדיוק הצליחה, כדי שרק הכרטיס שלה
      // יציג את ההודעה ואת כפתור "בחירת מועד" ה-disabled.
      setJustScheduledRequestId(request.id);

      // ממתינים קצת כדי שהחניכה תספיק לראות את ההודעה,
      // ורק אז טוענים מחדש - הכרטיס יעבור ל"פגישות שנקבעו".
      setTimeout(async () => {
        await loadRequests();
        setJustScheduledRequestId(null);
      }, 1800);
    } catch (requestError) {
      console.error(requestError);

      // אם השרת החזיר הודעת שגיאה ספציפית
      // (למשל שכבר יש פגישה פעילה),
      // מציגים אותה בתוך Popup במרכז המסך
      // ולא בתוך ה-Alert הכללי.
      const serverMessage =
        requestError.response?.data?.error;

      if (serverMessage) {
        setMeetingDialog({
          open: true,
          title: "לא ניתן לקבוע פגישה נוספת",
          message: serverMessage,
          buttonLabel: "הבנתי",
        });
      } else {
        setError("קביעת הפגישה נכשלה.");
      }
    }
  };


  // ============================================================
  // בקשות שבהן החניכה עדיין מחכה
  // שהמנטורית תציע מועדים.
  // ============================================================
  const waitingForMentorSlots = requests
    .filter(
      (request) =>
        request.status ===
        "WAITING_FOR_MENTOR_SLOTS"
    )
    .map((request) => ({
      id: request.id,

      mentorName: getMentorName(request),

      requestDate: formatDate(
        request.createdAt
      ),

      topic: getTopic(request),
    }));


  // ============================================================
  // בקשות שבהן המנטורית כבר הציעה מועדים
  // ועכשיו החניכה צריכה לבחור אחד מהם.
  // ============================================================
  const waitingForMenteeSelection = requests
    .filter(
      (request) =>
        request.status ===
        "WAITING_FOR_MENTEE_SELECTION"
    )
    .map((request) => {
      // ה-Backend מחזיר את סבבי התזמון
      // כשהחדש ביותר נמצא ראשון.
      const latestRound =
        request.schedulingRounds?.[0];

      return {
        id: request.id,

        mentorName: getMentorName(request),

        topic: getTopic(request),

        requestDate: formatDate(
          request.createdAt
        ),

        respondedDate: formatDate(
          latestRound?.createdAt ||
            request.updatedAt
        ),

        // המועדים שהמנטורית הציעה בסבב האחרון.
        // בשלב הבא נציג אותם בתוך הכרטיס
        // ונאפשר לחניכה לבחור אחד מהם.
        slots:
          latestRound?.offeredSlots || [],
      };
    });


  // ============================================================
  // פגישות שנקבעו ועדיין לא הסתיימו.
  // ============================================================
  const scheduledMeetings =
    requests.flatMap((request) =>
      (request.meetings || [])
        .filter(
          (meeting) =>
            meeting.status ===
              "SCHEDULED" ||
            meeting.status ===
              "ATTENDANCE_CONFIRMED"
        )
        .map((meeting) => ({
          id: meeting.id,

          mentorName:
            getMentorName(request),

          date: formatDate(
            meeting.scheduledStart
          ),

          startTime: formatTime(
            meeting.scheduledStart
          ),

          endTime: formatTime(
            meeting.scheduledEnd
          ),

          topic: getTopic(request),
        }))
    );


  // ============================================================
  // פגישות שכבר התקיימו.
  // ============================================================
  const completedMeetings =
    requests.flatMap((request) =>
      (request.meetings || [])
        .filter(
          (meeting) =>
            meeting.status === "COMPLETED"
        )
        .map((meeting) => {
          const start = new Date(
            meeting.scheduledStart
          );

          const end = new Date(
            meeting.scheduledEnd
          );

          // מחשבים את משך הפגישה בדקות.
          const durationMinutes = Math.round(
            (end - start) / 60000
          );

          return {
            id: meeting.id,

            mentorName:
              getMentorName(request),

            date: formatDate(
              meeting.scheduledStart
            ),

            time: formatTime(
              meeting.scheduledStart
            ),

            durationMinutes,

            topic: getTopic(request),

            feedbackSubmitted:
              request.status ===
              "FEEDBACK_COMPLETED",
          };
        })
    );


  // ============================================================
  // בזמן טעינת הנתונים מציגים Spinner.
  // ============================================================
  if (loading) {
    return (
      <Box
        sx={{
          py: 8,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">

        {/* כותרת עמוד הפגישות */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            sx={{
              direction: "ltr",
              justifyContent: "flex-start",
              mb: 1,
            }}
          >
            {/* אייקון יומן ורוד */}
            <CalendarMonthIcon
              sx={{
                color: queenbColors.pink,
                fontSize: 34,
              }}
            />

            {/* כותרת העמוד */}
            <Typography
              variant="h4"
              component="h1"
              dir="rtl"
              sx={{
                color: "#ed7fa5",
                fontWeight: 700,
              }}
            >
              הפגישות שלי
            </Typography>
          </Stack>


          {/* סרגל ניווט בין סוגי הפגישות */}
          <Stack
            direction="row"
            spacing={3}
            flexWrap="wrap"
            rowGap={1}
            sx={{
              justifyContent: "flex-start",
            }}
          >
            {SECTION_TABS.map((tab) => (
              <Button
                key={tab.id}
                component="a"
                href={`#${tab.id}`}
                variant="text"
                size="small"
                sx={{
                  px: 0,
                  minWidth: "auto",
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: 15,

                  "&:hover": {
                    bgcolor: "transparent",
                    color:
                      queenbColors.pink,
                  },
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
        </Box>


        {/* הודעת שגיאה */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}


        {/* ====================================================
            פגישות שהתקיימו
        ==================================================== */}
        <Box
          component="section"
          id="completed-section"
          sx={{
            scrollMarginTop: 140,
            mb: 6,
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            פגישות שהתקיימו
          </Typography>

          <Stack spacing={2}>
            {completedMeetings.length === 0 ? (
              <Typography color="text.secondary">
                אין פגישות שהתקיימו עדיין.
              </Typography>
            ) : (
              completedMeetings.map(
                (meeting) => (
                  <CompletedMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onAddFeedback={notReady}
                  />
                )
              )
            )}
          </Stack>
        </Box>


        {/* ====================================================
            פגישות שנקבעו
        ==================================================== */}
        <Box
          component="section"
          id="scheduled-section"
          sx={{
            scrollMarginTop: 140,
            mb: 6,
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            פגישות שנקבעו
          </Typography>

          <Stack spacing={2}>
            {scheduledMeetings.length === 0 ? (
              <Typography color="text.secondary">
                אין פגישות מתוכננות כרגע.
              </Typography>
            ) : (
              scheduledMeetings.map(
                (meeting) => (
                  <ScheduledMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onReschedule={notReady}
                    onCancel={
                      handleCancelMeeting
                    }
                  />
                )
              )
            )}
          </Stack>
        </Box>


        {/* ====================================================
            ממתינות להצעת זמנים
        ==================================================== */}
        <Box
          component="section"
          id="waiting-mentor-section"
          sx={{
            scrollMarginTop: 140,
            mb: 6,
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            ממתינות להצעת זמנים
          </Typography>

          <Stack spacing={2}>
            {waitingForMentorSlots.length ===
            0 ? (
              <Typography color="text.secondary">
                אין בקשות הממתינות להצעת
                זמנים.
              </Typography>
            ) : (
              waitingForMentorSlots.map(
                (request) => (
                  <PendingSlotsMeetingCard
                    key={request.id}
                    request={request}
                    onCancel={
                      handleCancelRequest
                    }
                  />
                )
              )
            )}
          </Stack>
        </Box>


        {/* ====================================================
            מחכות לבחירת מועד
        ==================================================== */}
        <Box
          component="section"
          id="waiting-mentee-section"
          sx={{
            scrollMarginTop: 140,
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            מחכות לבחירת מועד
          </Typography>

          <Stack spacing={2}>
            {waitingForMenteeSelection.length ===
            0 ? (
              <Typography color="text.secondary">
                אין בקשות הממתינות לבחירת
                מועד.
              </Typography>
            ) : (
              waitingForMenteeSelection.map(
                (request) => (
                  <SlotsToChooseMeetingCard
                    key={request.id}
                    request={request}

                    // בחירת מועד שולחת POST ל-
                    // /api/meetings/select-slot
                    // ויוצרת בפועל את הפגישה.
                    onChooseTime={
                      handleChooseTime
                    }

                    onCancel={
                      handleCancelRequest
                    }

                    // מציג הודעת הצלחה ירוקה בכרטיס הזה בלבד,
                    // אם הפגישה שלו רגע נקבעה בהצלחה.
                    justScheduled={
                      justScheduledRequestId ===
                      request.id
                    }
                  />
                )
              )
            )}
          </Stack>
        </Box>

      </Container>


      {/* הודעה לפיצ'רים שעוד לא מוכנים */}
      <ComingSoonSnackbar
        message={infoMessage}
        onClose={() =>
          setInfoMessage("")
        }
      />

      {/* ============================================================
          Popup גנרי בעקבות ניסיון לקבוע פגישה -
          משמש גם להודעת הצלחה וגם להודעת חסימה
          (למשל כשלחניכה כבר יש פגישה פעילה).
      ============================================================ */}
      <Dialog
        open={meetingDialog.open}
        onClose={closeMeetingDialog}
      >
        <DialogTitle>
          {meetingDialog.title}
        </DialogTitle>

        <DialogContent>
          <Typography>
            {meetingDialog.message}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeMeetingDialog}>
            {meetingDialog.buttonLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MenteeMeetingsPage;
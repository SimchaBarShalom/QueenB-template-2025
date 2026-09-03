import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import SendIcon from "@mui/icons-material/Send";
import EventIcon from "@mui/icons-material/Event";
import theme from "./theme";

const STATUSES = [
  "REQUESTED",
  "REJECTED_BY_MENTOR",
  "SLOTS_OFFERED",
  "MORE_SLOTS_REQUESTED",
  "MATCHED",
  "RESCHEDULE_REQUESTED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
  "FEEDBACK_PENDING",
  "FEEDBACK_COMPLETE",
];

const statusLabels = {
  REQUESTED: "בקשה נשלחה",
  REJECTED_BY_MENTOR: "נדחתה על ידי מנטורית",
  SLOTS_OFFERED: "הוצעו זמנים",
  MORE_SLOTS_REQUESTED: "התבקשו זמנים נוספים",
  MATCHED: "נקבעה פגישה",
  RESCHEDULE_REQUESTED: "התבקש תיאום מחדש",
  RESCHEDULED: "נקבע מחדש",
  CANCELLED: "בוטל",
  COMPLETED: "הושלם",
  NO_SHOW: "אי הגעה",
  FEEDBACK_PENDING: "ממתין לפידבק",
  FEEDBACK_COMPLETE: "פידבק הושלם",
};

function api(token) {
  return axios.create({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  const saveAuth = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return { token, user, saveAuth, logout, client: api(token) };
}

function Shell({ auth, children }) {
  return (
    <Box>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>Queens Match</Typography>
          {auth.user && <Button color="inherit" component={Link} to="/mentors">מנטוריות</Button>}
          {auth.user && <Button color="inherit" component={Link} to="/requests">בקשות</Button>}
          {auth.user && <Button color="inherit" component={Link} to="/meetings">פגישות</Button>}
          {auth.user && <Button color="inherit" component={Link} to="/profile">פרופיל</Button>}
          {auth.user?.role === "ADMIN" && <Button color="inherit" component={Link} to="/admin">ניהול</Button>}
          {!auth.user && <Button color="inherit" startIcon={<LoginIcon />} component={Link} to="/login">כניסה</Button>}
          {auth.user && <Button color="inherit" startIcon={<LogoutIcon />} onClick={auth.logout}>יציאה</Button>}
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>{children}</Container>
    </Box>
  );
}

function Protected({ auth, adminOnly = false, children }) {
  if (!auth.user) return <Navigate to="/login" replace />;
  if (adminOnly && auth.user.role !== "ADMIN") return <Navigate to="/mentors" replace />;
  return children;
}

function AuthForm({ auth, role }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ meetingCapacity: 3, meetingDurationMinutes: 45 });
  const [error, setError] = useState("");
  const isLogin = role === "login";
  const isMentor = role === "mentor";
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const url = isLogin ? "/api/auth/login" : `/api/auth/register/${role}`;
      const response = await axios.post(url, form);
      auth.saveAuth(response.data);
      navigate(response.data.user.role === "ADMIN" ? "/admin" : "/mentors");
    } catch (err) {
      setError(err.response?.data?.error || "הפעולה נכשלה");
    }
  };

  return (
    <Stack component="form" onSubmit={submit} spacing={2} sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h4">{isLogin ? "כניסה" : isMentor ? "הרשמת מנטורית" : "הרשמת מנטית"}</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {!isLogin && <TextField label="שם מלא" required onChange={set("name")} />}
      <TextField label="אימייל" type="email" required onChange={set("email")} />
      <TextField label="סיסמה" type="password" required helperText="לפחות 8 תווים עם אותיות ומספרים" onChange={set("password")} />
      {!isLogin && <ProfileFields form={form} set={set} mentorRequired={isMentor} />}
      {isMentor && <MentorFields form={form} set={set} />}
      <Button type="submit" variant="contained" startIcon={<LoginIcon />}>{isLogin ? "להיכנס" : "להירשם"}</Button>
      {isLogin && <Stack direction="row" spacing={2}><Button component={Link} to="/register/mentee">הרשמת מנטית</Button><Button component={Link} to="/register/mentor">הרשמת מנטורית</Button></Stack>}
    </Stack>
  );
}

function ProfileFields({ form, set, mentorRequired = false }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><TextField fullWidth label="שפות/טכנולוגיות" required={mentorRequired} value={form.stack || ""} onChange={set("stack")} /></Grid>
      <Grid item xs={12} md={6}><TextField fullWidth label="עבודה/מקום לימודים" required={mentorRequired} value={form.workplace || ""} onChange={set("workplace")} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth label="שנות ניסיון" type="number" required={mentorRequired} value={form.yearsExperience || ""} onChange={set("yearsExperience")} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth label="תמונה URL" value={form.photoUrl || ""} onChange={set("photoUrl")} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth label="GitHub" value={form.githubUrl || ""} onChange={set("githubUrl")} /></Grid>
      <Grid item xs={12}><TextField fullWidth label="LinkedIn" value={form.linkedinUrl || ""} onChange={set("linkedinUrl")} /></Grid>
    </Grid>
  );
}

function MentorFields({ form, set }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="רקע" required value={form.background || ""} onChange={set("background")} /></Grid>
      <Grid item xs={12}><TextField fullWidth label="נושאי מנטורינג" required value={form.topics || ""} onChange={set("topics")} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth label="כמות פגישות" type="number" required value={form.meetingCapacity || ""} onChange={set("meetingCapacity")} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth label="משך פגישה בדקות" type="number" required value={form.meetingDurationMinutes || ""} onChange={set("meetingDurationMinutes")} /></Grid>
      <Grid item xs={12} md={4}><TextField fullWidth label="קישור לפגישה" required value={form.meetingLink || ""} onChange={set("meetingLink")} /></Grid>
    </Grid>
  );
}

function MentorList({ auth }) {
  const [mentors, setMentors] = useState([]);
  useEffect(() => { auth.client.get("/api/mentors").then((res) => setMentors(res.data)); }, []);
  return (
    <Stack spacing={2}>
      <Typography variant="h4">מנטוריות זמינות</Typography>
      <Grid container spacing={2}>
        {mentors.map((mentor) => (
          <Grid item xs={12} md={4} key={mentor.id}>
            <Card><CardContent><Typography variant="h6">{mentor.name}</Typography><Typography color="text.secondary">{mentor.stack}</Typography><Typography>{mentor.mentorProfile?.topics}</Typography><Button sx={{ mt: 2 }} component={Link} to={`/mentors/${mentor.id}`} variant="outlined">פרטים ובקשה</Button></CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function MentorDetail({ auth }) {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { auth.client.get(`/api/mentors/${id}`).then((res) => setMentor(res.data)); }, [id]);
  const request = async () => {
    try { await auth.client.post("/api/requests", { mentorId: Number(id), message }); setNotice("הבקשה נשלחה"); } catch (err) { setNotice(err.response?.data?.error || "שליחת הבקשה נכשלה"); }
  };
  if (!mentor) return <Typography>טוען...</Typography>;
  return (
    <Stack spacing={2}>
      <Typography variant="h4">{mentor.name}</Typography>
      <Typography>{mentor.stack} | {mentor.workplace} | {mentor.yearsExperience} שנות ניסיון</Typography>
      <Typography>{mentor.mentorProfile?.background}</Typography>
      <Chip label={mentor.mentorProfile?.topics} sx={{ width: "fit-content" }} />
      {notice && <Alert severity={notice === "הבקשה נשלחה" ? "success" : "error"}>{notice}</Alert>}
      {auth.user?.role === "MENTEE" && <Stack spacing={2}><TextField label="הודעה למנטורית" multiline minRows={3} value={message} onChange={(e) => setMessage(e.target.value)} /><Button variant="contained" startIcon={<SendIcon />} onClick={request}>שליחת בקשה</Button></Stack>}
    </Stack>
  );
}

function RequestsPage({ auth }) {
  const [requests, setRequests] = useState([]);
  const [notice, setNotice] = useState("");
  const load = () => auth.client.get("/api/requests/me").then((res) => setRequests(res.data));
  useEffect(() => { load(); }, []);
  const action = async (fn) => {
    try { await fn(); setNotice("עודכן בהצלחה"); load(); } catch (err) { setNotice(err.response?.data?.error || "הפעולה נכשלה"); }
  };
  return <Stack spacing={2}><Typography variant="h4">בקשות מנטורינג</Typography>{notice && <Alert severity="info">{notice}</Alert>}{requests.map((request) => <RequestCard key={request.id} auth={auth} request={request} action={action} />)}</Stack>;
}

function RequestCard({ auth, request, action }) {
  const [slots, setSlots] = useState([{ startsAt: "", endsAt: "" }]);
  const isMentor = request.mentorId === auth.user.id;
  const isMentee = request.menteeId === auth.user.id;
  return (
    <Card><CardContent><Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"><Typography variant="h6">{request.mentor.name} / {request.mentee.name}</Typography><Chip label={statusLabels[request.status] || request.status} color="primary" variant="outlined" /></Stack>
      <Typography>{request.message}</Typography>
      {isMentor && ["REQUESTED", "MORE_SLOTS_REQUESTED", "RESCHEDULE_REQUESTED"].includes(request.status) && <Stack spacing={1}>{slots.map((slot, index) => <Grid container spacing={1} key={index}><Grid item xs={12} md={6}><TextField fullWidth type="datetime-local" label="התחלה" InputLabelProps={{ shrink: true }} onChange={(e) => setSlots(slots.map((s, i) => i === index ? { ...s, startsAt: e.target.value } : s))} /></Grid><Grid item xs={12} md={6}><TextField fullWidth type="datetime-local" label="סיום" InputLabelProps={{ shrink: true }} onChange={(e) => setSlots(slots.map((s, i) => i === index ? { ...s, endsAt: e.target.value } : s))} /></Grid></Grid>)}<Stack direction="row" spacing={1} flexWrap="wrap"><Button onClick={() => setSlots([...slots, { startsAt: "", endsAt: "" }])}>עוד זמן</Button><Button variant="contained" onClick={() => action(() => auth.client.post(`/api/requests/${request.id}/slots`, { slots }))}>הצעת זמנים</Button><Button color="error" onClick={() => action(() => auth.client.post(`/api/requests/${request.id}/reject`))}>דחייה</Button></Stack></Stack>}
      {isMentee && request.status === "SLOTS_OFFERED" && <Stack direction="row" spacing={1} flexWrap="wrap">{request.offeredSlots.map((slot) => <Button key={slot.id} variant="outlined" onClick={() => action(() => auth.client.post(`/api/requests/${request.id}/select-slot`, { slotId: slot.id }))}>{new Date(slot.startsAt).toLocaleString("he-IL")}</Button>)}{!request.extraSlotsRequested && <Button onClick={() => action(() => auth.client.post(`/api/requests/${request.id}/request-more-slots`))}>לבקש זמנים נוספים</Button>}{request.extraSlotsRequested && <Button color="error" onClick={() => action(() => auth.client.post(`/api/requests/${request.id}/reject`))}>לסיים בקשה</Button>}</Stack>}
    </Stack></CardContent></Card>
  );
}

function MeetingsPage({ auth }) {
  const [meetings, setMeetings] = useState([]);
  const [notice, setNotice] = useState("");
  const load = () => auth.client.get("/api/meetings/me").then((res) => setMeetings(res.data));
  useEffect(() => { load(); }, []);
  const action = async (fn) => { try { await fn(); setNotice("עודכן"); load(); } catch (err) { setNotice(err.response?.data?.error || "הפעולה נכשלה"); } };
  return <Stack spacing={2}><Typography variant="h4">הפגישות שלי</Typography>{notice && <Alert severity="info">{notice}</Alert>}{meetings.map((meeting) => <MeetingCard key={meeting.id} meeting={meeting} action={action} auth={auth} />)}</Stack>;
}

function MeetingCard({ meeting, action, auth }) {
  const [feedback, setFeedback] = useState({ rating: 5, text: "" });
  return (
    <Card><CardContent><Stack spacing={1}>
      <Typography variant="h6">{meeting.mentor.name} / {meeting.mentee.name}</Typography>
      <Typography>{new Date(meeting.startsAt).toLocaleString("he-IL")} | {meeting.meetingLink}</Typography>
      <Chip label={statusLabels[meeting.status] || meeting.status} sx={{ width: "fit-content" }} />
      <Stack direction="row" spacing={1} flexWrap="wrap"><Button onClick={() => action(() => auth.client.post(`/api/meetings/${meeting.id}/attendance`, { happened: true }))}>הפגישה התקיימה</Button><Button color="error" onClick={() => action(() => auth.client.post(`/api/meetings/${meeting.id}/attendance`, { happened: false }))}>לא התקיימה</Button><Button startIcon={<EventIcon />} onClick={() => action(() => auth.client.post(`/api/meetings/${meeting.id}/reschedule`))}>תיאום מחדש</Button></Stack>
      <Grid container spacing={1}><Grid item xs={12} md={2}><TextField fullWidth type="number" label="דירוג" value={feedback.rating} onChange={(e) => setFeedback({ ...feedback, rating: e.target.value })} /></Grid><Grid item xs={12} md={8}><TextField fullWidth label="פידבק" value={feedback.text} onChange={(e) => setFeedback({ ...feedback, text: e.target.value })} /></Grid><Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={() => action(() => auth.client.post(`/api/meetings/${meeting.id}/feedback`, feedback))}>שליחה</Button></Grid></Grid>
    </Stack></CardContent></Card>
  );
}

function ProfilePage({ auth }) {
  const [form, setForm] = useState({});
  const [notice, setNotice] = useState("");
  useEffect(() => { auth.client.get("/api/auth/me").then((res) => setForm({ ...res.data, ...(res.data.mentorProfile || {}) })); }, []);
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const save = async () => { try { const res = await auth.client.put("/api/mentor-profile/me", form); localStorage.setItem("user", JSON.stringify(res.data)); setNotice("פרופיל מנטורית נשמר"); } catch (err) { setNotice(err.response?.data?.error || "השמירה נכשלה"); } };
  return <Stack spacing={2}><Typography variant="h4">פרופיל ומעבר למנטורית</Typography>{notice && <Alert severity="info">{notice}</Alert>}<ProfileFields form={form} set={set} mentorRequired /><MentorFields form={form} set={set} /><Button variant="contained" onClick={save}>שמירת פרופיל מנטורית</Button></Stack>;
}

function AdminPage() {
  return <Stack spacing={2}><Typography variant="h4">ניהול</Typography><Stack direction="row" spacing={2} flexWrap="wrap"><Button variant="outlined" component={Link} to="/admin/users">משתמשות</Button><Button variant="outlined" component={Link} to="/admin/meetings">פגישות</Button><Button variant="outlined" component={Link} to="/admin/calendar">לוח פגישות</Button><Button variant="outlined" component={Link} to="/admin/alerts">התראות</Button></Stack></Stack>;
}

function AdminUsers({ auth }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { auth.client.get("/api/admin/users").then((res) => setUsers(res.data)); }, []);
  return <Stack spacing={2}><Typography variant="h4">משתמשות</Typography>{users.map((user) => <Card key={user.id}><CardContent><Typography variant="h6"><Link to={`/admin/users/${user.id}`}>{user.name}</Link></Typography><Typography>{user.email} | {user.role} | כמנטורית: {user.mentorCount} | כמנטית: {user.menteeCount}</Typography></CardContent></Card>)}</Stack>;
}

function AdminUserDetail({ auth }) {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  useEffect(() => { auth.client.get(`/api/admin/users/${id}`).then((res) => setUser(res.data)); }, [id]);
  if (!user) return <Typography>טוען...</Typography>;
  return <Stack spacing={2}><Typography variant="h4">{user.name}</Typography><Typography>{user.email} | {user.role}</Typography><Typography>{user.stack} | {user.workplace}</Typography><Typography>פגישות כמנטורית: {user.mentorMeetings.length}, כמנטית: {user.menteeMeetings.length}</Typography></Stack>;
}

function AdminMeetings({ auth, calendar = false }) {
  const [search, setSearch] = useSearchParams();
  const [meetings, setMeetings] = useState([]);
  const filters = useMemo(() => Object.fromEntries(search.entries()), [search]);
  useEffect(() => { auth.client.get("/api/admin/meetings", { params: filters }).then((res) => setMeetings(res.data)); }, [search]);
  const color = (status) => ({ NO_SHOW: "error", FEEDBACK_PENDING: "warning", FEEDBACK_COMPLETE: "success", MATCHED: "primary", RESCHEDULED: "secondary" }[status] || "default");
  return <Stack spacing={2}><Typography variant="h4">{calendar ? "לוח פגישות" : "פגישות"}</Typography>{!calendar && <Grid container spacing={1}><Grid item xs={12} md={4}><TextField select fullWidth label="סטטוס" value={filters.status || ""} onChange={(e) => setSearch({ ...filters, status: e.target.value })}><MenuItem value="">הכל</MenuItem>{STATUSES.map((s) => <MenuItem key={s} value={s}>{statusLabels[s]}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={4}><TextField fullWidth label="mentorId" value={filters.mentorId || ""} onChange={(e) => setSearch({ ...filters, mentorId: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label="menteeId" value={filters.menteeId || ""} onChange={(e) => setSearch({ ...filters, menteeId: e.target.value })} /></Grid></Grid>}<Grid container spacing={2}>{meetings.map((meeting) => <Grid item xs={12} md={calendar ? 3 : 12} key={meeting.id}><Card><CardContent><Chip color={color(meeting.status)} label={statusLabels[meeting.status]} /><Typography variant="h6"><Link to={`/admin/meetings/${meeting.id}`}>{new Date(meeting.startsAt).toLocaleString("he-IL")}</Link></Typography><Typography>{meeting.mentor.name} / {meeting.mentee.name}</Typography></CardContent></Card></Grid>)}</Grid></Stack>;
}

function AdminMeetingDetail({ auth }) {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  useEffect(() => { auth.client.get(`/api/admin/meetings/${id}`).then((res) => setMeeting(res.data)); }, [id]);
  if (!meeting) return <Typography>טוען...</Typography>;
  return <Stack spacing={2}><Typography variant="h4">פגישה</Typography><Typography>{meeting.mentor.name} / {meeting.mentee.name}</Typography><Typography>{new Date(meeting.startsAt).toLocaleString("he-IL")} | {meeting.status}</Typography><Divider /><Typography variant="h6">נוכחות</Typography>{meeting.attendanceConfirmations.map((a) => <Typography key={a.id}>{a.user.name}: {a.happened ? "התקיימה" : "לא התקיימה"}</Typography>)}<Typography variant="h6">פידבק</Typography>{meeting.feedback.map((f) => <Typography key={f.id}>{f.user.name}: {f.rating}/5 - {f.text}</Typography>)}</Stack>;
}

function AdminAlerts({ auth }) {
  const [alerts, setAlerts] = useState(null);
  useEffect(() => { auth.client.get("/api/admin/alerts").then((res) => setAlerts(res.data)); }, []);
  if (!alerts) return <Typography>טוען...</Typography>;
  return <Stack spacing={2}><Typography variant="h4">התראות</Typography><Alert severity="error">אי הגעה: {alerts.noShows.length}</Alert><Alert severity="warning">פגישות עבר שממתינות לאישור נוכחות: {alerts.pastNeedAttendance.length}</Alert><Alert severity="warning">פידבק חסר מעל שבוע: {alerts.missingFeedback.length}</Alert><Alert severity="success">מנטוריות עם יותר מ-10 פגישות: {alerts.appreciationMentors.length}</Alert></Stack>;
}

function Home({ auth }) {
  if (auth.user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (auth.user) return <Navigate to="/mentors" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  const auth = useAuth();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Shell auth={auth}>
          <Routes>
            <Route path="/" element={<Home auth={auth} />} />
            <Route path="/login" element={<AuthForm auth={auth} role="login" />} />
            <Route path="/register/mentee" element={<AuthForm auth={auth} role="mentee" />} />
            <Route path="/register/mentor" element={<AuthForm auth={auth} role="mentor" />} />
            <Route path="/mentors" element={<Protected auth={auth}><MentorList auth={auth} /></Protected>} />
            <Route path="/mentors/:id" element={<Protected auth={auth}><MentorDetail auth={auth} /></Protected>} />
            <Route path="/requests" element={<Protected auth={auth}><RequestsPage auth={auth} /></Protected>} />
            <Route path="/meetings" element={<Protected auth={auth}><MeetingsPage auth={auth} /></Protected>} />
            <Route path="/profile" element={<Protected auth={auth}><ProfilePage auth={auth} /></Protected>} />
            <Route path="/admin" element={<Protected auth={auth} adminOnly><AdminPage /></Protected>} />
            <Route path="/admin/users" element={<Protected auth={auth} adminOnly><AdminUsers auth={auth} /></Protected>} />
            <Route path="/admin/users/:id" element={<Protected auth={auth} adminOnly><AdminUserDetail auth={auth} /></Protected>} />
            <Route path="/admin/meetings" element={<Protected auth={auth} adminOnly><AdminMeetings auth={auth} /></Protected>} />
            <Route path="/admin/meetings/:id" element={<Protected auth={auth} adminOnly><AdminMeetingDetail auth={auth} /></Protected>} />
            <Route path="/admin/calendar" element={<Protected auth={auth} adminOnly><AdminMeetings auth={auth} calendar /></Protected>} />
            <Route path="/admin/alerts" element={<Protected auth={auth} adminOnly><AdminAlerts auth={auth} /></Protected>} />
          </Routes>
        </Shell>
      </Router>
    </ThemeProvider>
  );
}

export default App;

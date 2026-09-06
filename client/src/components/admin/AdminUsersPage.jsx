import React, { useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import apiClient from "../../api/client";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminLayout from "./AdminLayout";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";

function CapabilityChips({ user }) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" rowGap={0.5}>
      <Chip label="חניכה" size="small" />
      {user.capabilities.mentor && <Chip label="מנטורית" color="secondary" size="small" />}
      {user.capabilities.admin && <Chip label="מנהלת" color="primary" size="small" />}
    </Stack>
  );
}

function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [capability, setCapability] = useState(searchParams.get("capability") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/admin/users", {
        params: { search: search || undefined, capability: capability || undefined },
      });
      setUsers(response.data);
    } catch (requestError) {
      console.error(requestError);
      setError("לא הצלחנו לטעון משתמשות.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // Initial load uses URL/default filter state; filter changes are applied explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setSearchParams({ ...(search ? { search } : {}), ...(capability ? { capability } : {}) });
    loadUsers();
  };

  const updateAdmin = async (user, isAdmin) => {
    try {
      setError("");
      setSuccess("");
      const response = await apiClient.patch(`/api/admin/users/${user.id}/admin`, { isAdmin });
      setUsers((current) => current.map((item) => (item.id === user.id ? response.data : item)));
      setSuccess(isAdmin ? "הרשאת מנהלת נוספה." : "הרשאת מנהלת הוסרה.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "עדכון הרשאות נכשל.");
    }
  };

  const updateMentorVisibility = async (user, isActive) => {
    try {
      setError("");
      setSuccess("");
      const response = await apiClient.patch(`/api/admin/mentors/${user.mentorProfile.id}/visibility`, { isActive });
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, mentorProfile: { ...item.mentorProfile, ...response.data } } : item
        )
      );
      setSuccess(isActive ? "המנטורית הופעלה בחיפוש." : "המנטורית הוסתרה מחיפוש.");
    } catch (requestError) {
      console.error(requestError);
      setError("עדכון נראות המנטורית נכשל.");
    }
  };

  const requestAdminChange = (user, isAdmin) => {
    if (!isAdmin) {
      setPendingAction({
        title: "להסיר הרשאת מנהלת?",
        description: `המשתמשת ${user.fullName} לא תוכל להיכנס לאזור הניהול.`,
        confirmLabel: "הסרת הרשאה",
        confirmColor: "error",
        run: () => updateAdmin(user, false),
      });
      return;
    }

    updateAdmin(user, true);
  };

  const requestMentorVisibilityChange = (user, isActive) => {
    if (!isActive) {
      setPendingAction({
        title: "להסתיר מנטורית מחיפוש?",
        description: `${user.fullName} תישאר במערכת, אבל חניכות לא יראו אותה בחיפוש מנטוריות.`,
        confirmLabel: "הסתרה",
        confirmColor: "error",
        run: () => updateMentorVisibility(user, false),
      });
      return;
    }

    updateMentorVisibility(user, true);
  };

  const confirmPendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action?.run) {
      await action.run();
    }
  };

  if (loading) return <AdminLoading />;

  return (
    <AdminLayout>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 800 }}>
        משתמשות
      </Typography>
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField label="חיפוש" value={search} onChange={(event) => setSearch(event.target.value)} fullWidth />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>יכולת</InputLabel>
            <Select label="יכולת" value={capability} onChange={(event) => setCapability(event.target.value)}>
              <MenuItem value="">הכול</MenuItem>
              <MenuItem value="admin">מנהלות</MenuItem>
              <MenuItem value="mentor">מנטוריות</MenuItem>
              <MenuItem value="mentee">חניכות</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={applyFilters}>
            סינון
          </Button>
        </Stack>
      </Paper>

      {users.length === 0 ? (
        <AdminEmpty title="אין משתמשות להצגה" subtitle="נסי לשנות את הסינון." />
      ) : (
        <Paper sx={{ borderRadius: 2, overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם</TableCell>
                <TableCell>אימייל</TableCell>
                <TableCell>יכולות</TableCell>
                <TableCell>מנהלת</TableCell>
                <TableCell>נראות מנטורית</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <CapabilityChips user={user} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={user.permissions.removeAdminDisabledReason || ""}>
                      <Box component="span">
                        <Switch
                          checked={user.isAdmin}
                          disabled={user.isAdmin && !user.permissions.canRemoveAdmin}
                          onChange={(event) => requestAdminChange(user, event.target.checked)}
                        />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {user.mentorProfile ? (
                      <Switch
                        checked={user.mentorProfile.isActive}
                        onChange={(event) => requestMentorVisibilityChange(user, event.target.checked)}
                      />
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        לא מנטורית
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button component={RouterLink} to={`/admin/users/${user.id}`} size="small">
                      פרטים
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title || ""}
        description={pendingAction?.description || ""}
        confirmLabel={pendingAction?.confirmLabel || "אישור"}
        confirmColor={pendingAction?.confirmColor || "primary"}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </AdminLayout>
  );
}

export default AdminUsersPage;

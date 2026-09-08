import React, { useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
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
import { AdminPageHeader, AdminSurface } from "./AdminPrimitives";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";

function CapabilityChips({ user }) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" rowGap={0.5}>
      <Chip label="מנטית" size="small" />
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
  const [selectedIds, setSelectedIds] = useState([]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/admin/users", {
        params: { search: search || undefined, capability: capability || undefined },
      });
      setUsers(response.data);
      setSelectedIds([]);
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

  const confirmPendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action?.run) {
      await action.run();
    }
  };

  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  const adminSelection = selectedUsers.filter((user) => !user.isAdmin);

  const toggleSelected = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const runBulkMakeAdmin = () => {
    setPendingAction({
      title: "להוסיף הרשאת מנהלת?",
      description: `${adminSelection.length} משתמשות יקבלו גישה לאזור הניהול.`,
      confirmLabel: "הוספת הרשאה",
      run: async () => {
        const targets = adminSelection;
        for (const user of targets) {
          await updateAdmin(user, true);
        }
        setSelectedIds([]);
      },
    });
  };

  if (loading) return <AdminLoading />;

  return (
    <AdminLayout>
      <AdminPageHeader title="משתמשות" subtitle="חיפוש וניהול הרשאות מנהלת." breadcrumbs={[{ label: "משתמשות" }]} />
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <AdminSurface sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "center" }}>
          <TextField size="small" label="חיפוש" placeholder="שם, אימייל, תפקיד או מקום עבודה" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: { sm: 250 } }} />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>תפקיד</InputLabel>
            <Select label="תפקיד" value={capability} onChange={(event) => setCapability(event.target.value)}>
              <MenuItem value="">הכול</MenuItem>
              <MenuItem value="admin">מנהלות</MenuItem>
              <MenuItem value="mentor">מנטוריות</MenuItem>
              <MenuItem value="mentee">מנטיות</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={applyFilters}>
            סינון
          </Button>
        </Stack>
      </AdminSurface>

      {selectedIds.length > 0 && (
        <AdminSurface sx={{ p: 1.5, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>{selectedIds.length} נבחרו</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              <Button size="small" variant="outlined" disabled={!adminSelection.length} onClick={runBulkMakeAdmin}>הוספת הרשאת מנהלת</Button>
            </Stack>
          </Stack>
        </AdminSurface>
      )}

      {users.length === 0 ? (
        <AdminEmpty title="אין משתמשות להצגה" subtitle="נסי לשנות את הסינון." />
      ) : (
        <>
        <AdminSurface sx={{ overflowX: "auto", display: { xs: "none", md: "block" } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>שם</TableCell>
                <TableCell>אימייל</TableCell>
                <TableCell>תפקידים</TableCell>
                <TableCell>מנהלת</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(user.id)} onChange={() => toggleSelected(user.id)} />
                  </TableCell>
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
                    <Button component={RouterLink} to={`/admin/users/${user.id}`} size="small">
                      פרטים
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminSurface>
        <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
          {users.map((user) => (
            <AdminSurface key={user.id} sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{user.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                  </Box>
                  <Checkbox checked={selectedIds.includes(user.id)} onChange={() => toggleSelected(user.id)} />
                </Stack>
                <CapabilityChips user={user} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">מנהלת</Typography>
                  <Switch checked={user.isAdmin} disabled={user.isAdmin && !user.permissions.canRemoveAdmin} onChange={(event) => requestAdminChange(user, event.target.checked)} />
                </Stack>
                <Button component={RouterLink} to={`/admin/users/${user.id}`} size="small" sx={{ alignSelf: "flex-start" }}>פרטים</Button>
              </Stack>
            </AdminSurface>
          ))}
        </Stack>
        </>
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

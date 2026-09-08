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
import { useLanguage } from "../../i18n/LanguageContext";

function CapabilityChips({ user }) {
  const { t } = useLanguage();
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" rowGap={0.5}>
      <Chip label={t("roles.mentee")} size="small" />
      {user.capabilities.mentor && <Chip label={t("roles.mentor")} color="secondary" size="small" />}
      {user.capabilities.admin && <Chip label={t("roles.admin")} color="primary" size="small" />}
    </Stack>
  );
}

function AdminUsersPage() {
  const { t } = useLanguage();
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
      setError(t("errors.loadUsers"));
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
      setSuccess(isAdmin ? t("admin.users.adminAdded") : t("admin.users.adminRemoved"));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || t("errors.updatePermissions"));
    }
  };

  const requestAdminChange = (user, isAdmin) => {
    if (!isAdmin) {
      setPendingAction({
        title: t("admin.users.removeAdminTitle"),
        description: t("admin.users.removeAdminBody", { name: user.fullName }),
        confirmLabel: t("admin.users.removeAdminConfirm"),
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
      title: t("admin.users.addAdminTitle"),
      description: t("admin.users.addAdminBody", { count: adminSelection.length }),
      confirmLabel: t("admin.users.addAdminConfirm"),
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
      <AdminPageHeader title={t("admin.users.title")} subtitle={t("admin.users.subtitle")} breadcrumbs={[{ label: t("admin.users.title") }]} />
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <AdminSurface sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "center" }}>
          <TextField size="small" label={t("admin.users.search")} placeholder={t("admin.users.searchPlaceholder")} value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: { sm: 250 } }} />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t("admin.users.role")}</InputLabel>
            <Select label={t("admin.users.role")} value={capability} onChange={(event) => setCapability(event.target.value)}>
              <MenuItem value="">{t("admin.all")}</MenuItem>
              <MenuItem value="admin">{t("admin.users.admins")}</MenuItem>
              <MenuItem value="mentor">{t("admin.users.mentors")}</MenuItem>
              <MenuItem value="mentee">{t("admin.users.mentees")}</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={applyFilters}>
            {t("common.filter")}
          </Button>
        </Stack>
      </AdminSurface>

      {selectedIds.length > 0 && (
        <AdminSurface sx={{ p: 1.5, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>{t("admin.users.selectedCount", { count: selectedIds.length })}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              <Button size="small" variant="outlined" disabled={!adminSelection.length} onClick={runBulkMakeAdmin}>{t("admin.users.addAdminBulk")}</Button>
            </Stack>
          </Stack>
        </AdminSurface>
      )}

      {users.length === 0 ? (
        <AdminEmpty title={t("admin.users.emptyTitle")} subtitle={t("admin.users.emptySubtitle")} />
      ) : (
        <>
        <AdminSurface sx={{ overflowX: "auto", display: { xs: "none", md: "block" } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>{t("admin.users.name")}</TableCell>
                <TableCell>{t("admin.users.email")}</TableCell>
                <TableCell>{t("admin.users.roles")}</TableCell>
                <TableCell>{t("admin.users.isAdmin")}</TableCell>
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
                      {t("common.details")}
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
                  <Typography variant="body2">{t("admin.users.isAdmin")}</Typography>
                  <Switch checked={user.isAdmin} disabled={user.isAdmin && !user.permissions.canRemoveAdmin} onChange={(event) => requestAdminChange(user, event.target.checked)} />
                </Stack>
                <Button component={RouterLink} to={`/admin/users/${user.id}`} size="small" sx={{ alignSelf: "flex-start" }}>{t("common.details")}</Button>
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
        confirmLabel={pendingAction?.confirmLabel || t("common.confirm")}
        confirmColor={pendingAction?.confirmColor || "primary"}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </AdminLayout>
  );
}

export default AdminUsersPage;

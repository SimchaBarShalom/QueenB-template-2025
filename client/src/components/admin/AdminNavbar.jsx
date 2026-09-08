import React from "react";
import RoleNavbar from "../RoleNavbar";
import { useLanguage } from "../../i18n/LanguageContext";

const NAV_ITEMS = [
  { path: "/admin", labelKey: "admin.nav.home", exact: true },
  { path: "/admin/users", labelKey: "admin.nav.users" },
  { path: "/admin/meetings", labelKey: "admin.nav.meetings" },
  { path: "/admin/calendar", labelKey: "admin.nav.calendar" },
];

function AdminNavbar({ currentUser, onLogout }) {
  const { t } = useLanguage();
  const items = NAV_ITEMS.map((item) => ({ ...item, label: t(item.labelKey) }));
  return <RoleNavbar currentUser={currentUser} onLogout={onLogout} homePath="/admin" items={items} ariaLabel={t("admin.nav.aria")} />;
}

export default AdminNavbar;

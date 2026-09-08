import React from "react";
import RoleNavbar from "../RoleNavbar";

const NAV_ITEMS = [
  { path: "/admin", label: "מסך הבית", exact: true },
  { path: "/admin/users", label: "משתמשות" },
  { path: "/admin/meetings", label: "פגישות" },
  { path: "/admin/calendar", label: "לוח שנה" },
];

function AdminNavbar({ currentUser, onLogout }) {
  return <RoleNavbar currentUser={currentUser} onLogout={onLogout} homePath="/admin" items={NAV_ITEMS} ariaLabel="ניווט ניהול" />;
}

export default AdminNavbar;

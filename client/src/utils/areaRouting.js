// A single account can carry mentee + mentor + admin capabilities at once
// (see server/prisma/schema.prisma). These helpers centralize how the
// frontend decides "which area" a user lands in / can switch to, so that
// logic isn't duplicated between the auth dialogs and the user menu.

export function isMentorUser(user) {
  return Boolean(user?.mentorProfile);
}

// Priority after login/registration: admin-only -> admin, mentor -> mentor
// (even if also admin), everyone else -> mentee.
export function getDefaultAreaPath(user) {
  if (!user) return "/";
  if (user.isAdmin && !isMentorUser(user)) return "/admin";
  if (isMentorUser(user)) return "/mentor";
  return "/mentee";
}

export const AREA_DEFINITIONS = [
  { path: "/mentee", label: "עברי לאזור חניכה", available: () => true },
  { path: "/mentor", label: "עברי לאזור מנטורית", available: (user) => isMentorUser(user) },
  { path: "/admin", label: "עברי לאזור ניהול", available: (user) => Boolean(user?.isAdmin) },
];

// Areas the user can switch to from wherever they currently are, excluding
// the area they're already viewing.
export function getSwitchableAreas(user, currentPathname) {
  return AREA_DEFINITIONS.filter(
    (area) => area.available(user) && !currentPathname.startsWith(area.path)
  );
}

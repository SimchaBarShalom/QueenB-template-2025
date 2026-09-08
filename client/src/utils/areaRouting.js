export function isMentorUser(user) {
  return Boolean(user?.mentorProfile);
}

// Administration is a distinct capability, so it remains the default landing
// area even when an administrator also has a mentor profile.
export function getDefaultAreaPath(user) {
  if (!user) return "/";
  if (user.isAdmin) return "/admin";
  if (isMentorUser(user)) return "/mentor";
  return "/mentee";
}

export const AREA_DEFINITIONS = [
  {
    path: "/mentee",
    labelKey: "nav.switchToMentee",
    available: (user) => Boolean(user) && !user.isAdmin,
  },
  { path: "/mentor", labelKey: "nav.switchToMentor", available: (user) => isMentorUser(user) && !user.isAdmin },
  { path: "/admin", labelKey: "nav.switchToAdmin", available: (user) => Boolean(user?.isAdmin) },
];

// Areas the user can switch to from wherever they currently are, excluding
// the area they're already viewing.
export function getSwitchableAreas(user, currentPathname) {
  return AREA_DEFINITIONS.filter(
    (area) => area.available(user) && !currentPathname.startsWith(area.path)
  );
}

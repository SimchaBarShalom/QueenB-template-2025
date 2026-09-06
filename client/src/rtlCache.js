import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";

// MUI's theme `direction: "rtl"` only flips the components that read
// theme.direction explicitly (Drawer anchor, icon mirroring, etc). Most of
// the actual field layout - input label position, adornment side, notched
// outline - comes from physical left/right CSS emitted by emotion, which
// needs the stylis RTL plugin to be mirrored. Without this cache, RTL pages
// render with labels/icons stuck on the physical-left regardless of
// `theme.direction` (the bug behind "these fields are in the wrong
// direction").
export const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export const ltrCache = createCache({ key: "mui" });

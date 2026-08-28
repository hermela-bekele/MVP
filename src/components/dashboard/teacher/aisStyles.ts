/**
 * Teacher-portal Tailwind utility bundles, mostly remapped onto the shared
 * shadcn tokens (--primary, --border, --muted, etc.) so the teacher portal
 * renders with the same palette as every other portal. The notification
 * panel/menu and primary button still use the separate "Academic
 * Intelligence System" (AIS) color-token set (--color-ais-*, --color-btn-*).
 * Export names are kept stable — consumers (TeacherPortalUi.tsx and ~30 direct
 * importers) need no changes.
 */

export const aisPage = 'w-full text-left';

/** Sidebar shell — gray surface, blue nav accents */
export const aisSidebarShell =
  'flex flex-col h-screen sticky top-0 shrink-0 bg-muted border-r border-border sidebar-transition overflow-hidden';

export const aisSidebarMobileShell =
  'fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] flex flex-col bg-muted transition-transform duration-300 ease-out shadow-2xl lg:hidden';

export const aisSidebarBrand =
  'h-16 border-b border-border flex items-center shrink-0 gap-2';

export const aisSidebarLogo =
  'h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-sm';

export const aisSidebarBrandTitle = 'font-bold text-sm text-foreground truncate leading-tight';

export const aisSidebarBrandSubtitle =
  'text-[10px] text-muted-foreground font-medium truncate';

export const aisSidebarCollapseBtn =
  'hidden lg:flex p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent/10 transition-all duration-200 cursor-pointer shrink-0';

export const aisSidebarSectionHeader =
  'text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 pt-4 pb-1 select-none';

export const aisSidebarSectionDivider = 'my-2 border-b border-border';

export const aisSidebarNavItem =
  'w-full flex items-center rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer group';

export const aisSidebarNavItemActive =
  'bg-card text-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisSidebarNavItemInactive =
  'text-muted-foreground hover:text-primary hover:bg-accent/10';

export const aisSidebarNavIconActive = 'shrink-0 text-primary scale-105';

export const aisSidebarNavIconInactive =
  'shrink-0 text-primary/70 group-hover:text-primary opacity-90 group-hover:opacity-100';

export const aisSidebarBadge =
  'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5';

export const aisSidebarFooter = 'shrink-0 p-3 border-t border-border';

export const aisSidebarLogoutBtn =
  'w-full flex items-center rounded-lg text-[13px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer';

/** Top navbar — matches sidebar / portal surfaces */
export const aisNavbar =
  'h-14 border-b border-border bg-muted px-4 sm:px-5 lg:px-4 flex items-center justify-between sticky top-0 z-30 w-full';

export const aisNavbarIconBtn =
  'p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent/10 transition-colors cursor-pointer';

export const aisNavbarSearch =
  'w-full h-9 px-3 bg-card border border-border rounded-lg text-xs text-muted-foreground flex items-center justify-between transition-all duration-200 group cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20';

export const aisNavbarSearchKbd =
  'hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground select-none';

export const aisNavbarAvatar =
  'h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0';

export const aisNavbarProfileBtn =
  'flex items-center space-x-2.5 hover:bg-accent/10 p-1.5 rounded-lg transition-colors cursor-pointer';

export const aisNavbarProfileName = 'text-xs font-bold text-foreground';

export const aisNavbarProfileRole = 'text-[10px] text-muted-foreground';

export const aisNavbarDropdown =
  'absolute right-0 mt-2 bg-card border border-border rounded-lg shadow-[0_4px_12px_rgba(15,23,42,0.08)] z-30 animate-fade-in';

export const aisNavbarOverlay = 'fixed inset-0 z-20';

export const aisNavbarNotifPanel =
  'absolute right-0 z-30 mt-2.5 flex w-[400px] max-w-[calc(100vw-2rem)] max-h-[34rem] flex-col overflow-hidden rounded-2xl border border-ais-card-border bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] animate-fade-in';

export const aisNavbarNotifHeader =
  'flex shrink-0 items-center justify-between px-4 py-3.5';

export const aisNavbarNotifFilters =
  'flex shrink-0 gap-1 rounded-full bg-ais-surface-container-low p-1 mx-4 mb-3';

export const aisNavbarNotifFilterBtn =
  'flex-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all duration-150';

export const aisNavbarNotifFilterBtnActive =
  'bg-white text-ais-primary shadow-[0_1px_4px_rgba(15,23,42,0.12)]';

export const aisNavbarNotifFilterBtnInactive =
  'text-ais-on-surface-variant hover:text-ais-primary';

export const aisNavbarNotifSectionHeader =
  'px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-ais-outline';

export const aisNavbarNotifList =
  'scrollbar-none flex-1 overflow-y-auto border-t border-ais-card-border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const aisNavbarNotifItem =
  'group relative px-4 py-3.5 transition-colors hover:bg-ais-row-hover';

export const aisNavbarNotifItemUnread =
  'bg-ais-primary/[0.03] before:absolute before:left-1.5 before:top-[1.35rem] before:h-1.5 before:w-1.5 before:rounded-full before:bg-ais-primary';

export const aisNavbarNotifItemInner = 'flex gap-3 pl-2';

export const aisNavbarNotifIconWrap =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full';

export const aisNavbarNotifIconAlert = 'bg-ais-error/10 text-ais-error';

export const aisNavbarNotifIconSuccess = 'bg-ais-success/10 text-ais-success';

export const aisNavbarNotifIconRequest = 'bg-ais-primary/10 text-ais-primary';

export const aisNavbarNotifIconInfo = 'bg-ais-surface-container-low text-ais-on-surface-variant';

export const aisNavbarNotifActionBtn =
  'flex h-7 w-7 items-center justify-center rounded-full text-ais-on-surface-variant transition-colors hover:bg-ais-surface-container-low hover:text-ais-primary cursor-pointer';

export const aisNavbarNotifActionBtnDanger =
  'flex h-7 w-7 items-center justify-center rounded-full text-ais-on-surface-variant transition-colors hover:bg-ais-error/10 hover:text-ais-error cursor-pointer';

export const aisNavbarNotifActions =
  'flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';

export const aisNavbarNotifFooterBtn =
  'inline-flex items-center gap-1.5 rounded-full bg-ais-primary/10 px-3 py-1.5 text-[11px] font-bold text-ais-primary transition-colors hover:bg-ais-primary/20 cursor-pointer';

export const aisNavbarNotifTypeRequest = 'text-[11px] font-semibold text-ais-primary';

export const aisNavbarNotifTypeAlert = 'text-[11px] font-semibold text-ais-error';

export const aisNavbarNotifTypeSuccess = 'text-[11px] font-semibold text-ais-success';

export const aisNavbarNotifTypeInfo = 'text-[11px] font-semibold text-ais-on-surface-variant';

export const aisNavbarNotifBadge =
  'absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ais-error px-1 text-[9px] font-bold text-white ring-2 ring-white';

export const aisNavbarDropdownItem =
  'w-full text-left px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors cursor-pointer';

/** Shared card shell — no accent strips, uniform radius, gray border */
export const aisCard =
  'rounded-lg border border-border bg-card shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisKpiCard = `${aisCard} flex min-h-[128px] flex-col justify-between p-6`;

export const aisKpiLabel =
  'text-xs font-bold uppercase leading-4 tracking-widest text-primary';

export const aisKpiPill =
  'inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground';

export const aisKpiPillSuccess =
  'inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success';

export const aisKpiPillError =
  'inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive';

export const aisUserBadge =
  'inline-flex items-center gap-2 rounded-full border border-border bg-muted pl-1 pr-3 py-1 text-sm font-semibold text-foreground';

export const aisUserBadgeAvatar =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground';

export const aisKpiValue = 'text-3xl font-bold tabular-nums leading-none text-foreground';

export const aisStatTile = `${aisCard} p-4`;

export const aisAlertRow = `${aisCard} px-3 py-2`;

/** Student Activity — single panel with internal scroll */
export const aisActivityPanel =
  `${aisCard} flex max-h-[calc(100vh-14rem)] min-h-0 flex-col overflow-hidden`;

export const aisActivityPanelHeader =
  'shrink-0 border-b border-border px-4 py-4';

export const aisActivityScroll =
  'scrollbar-none min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const aisActivityAlertRow =
  'rounded-md border border-destructive/15 bg-destructive/5 px-3 py-2';

export const aisActivityStudentRow =
  'rounded-md border border-border bg-muted/50 p-4';

export const aisSchedulePanel =
  `${aisCard} flex min-h-0 flex-1 flex-col overflow-hidden`;

export const aisScheduleFilterBtn =
  'w-full rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors';

export const aisScheduleFilterBtnActive =
  'bg-card text-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisScheduleFilterBtnInactive =
  'text-muted-foreground hover:bg-accent/10 hover:text-primary';

export const aisScheduleListRow =
  'flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40';

export const aisBtnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-btn-primary px-6 py-2 text-sm font-semibold text-btn-primary-foreground transition-all hover:bg-btn-primary/90 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-btn-primary [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0';

export const aisBtnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted shadow-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0';

export const aisBtnGhost =
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:text-accent [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0';

export const aisBtnGhostMuted =
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0';

export const aisBadgeSuccess =
  'inline-flex items-center gap-1 rounded-lg bg-success/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-success';

export const aisBadgeWarning =
  'inline-flex items-center gap-1 rounded-lg bg-warning/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-warning';

export const aisBadgeError =
  'inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-destructive';

export const aisLabelCaps =
  'text-[11px] font-bold uppercase leading-4 tracking-widest text-muted-foreground';

export const aisDisplayMd = 'text-2xl font-semibold tracking-tight text-foreground';

export const aisHeadlineSm = 'text-xl font-semibold text-foreground';

export const aisDataLg = 'text-lg font-semibold tabular-nums text-foreground';

export const aisDataMd = 'text-sm font-medium tabular-nums text-foreground';

export const aisBodyMd = 'text-sm leading-5 text-muted-foreground';

export const aisBodySm = 'text-xs leading-4 text-muted-foreground';

/** Form controls */
export const aisInput =
  'w-full h-10 px-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors';

export const aisTextarea =
  'w-full min-h-[6rem] px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors';

export const aisFormLabel =
  'text-[10px] font-bold uppercase tracking-wider text-muted-foreground';

/** Sub-tab switcher (matches sidebar nav pills) */
export const aisSubTabTrack =
  'flex w-fit gap-1 rounded-lg border border-border bg-muted/40 p-1';

export const aisSubTabBtn =
  'rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer';

export const aisSubTabBtnActive =
  'bg-card text-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisSubTabBtnInactive =
  'text-muted-foreground hover:text-primary hover:bg-accent/10';

/** Panel header */
export const aisPanelHeader =
  'flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between';

/** List / form rows */
export const aisListRow =
  'rounded-lg border border-border bg-muted/50 p-4';

export const aisCallout =
  'rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary';

/** Segmented toggle (attendance etc.) */
export const aisSegmentBtn =
  'rounded-lg px-2.5 py-1 text-[10px] font-bold border cursor-pointer transition-colors';

export const aisSegmentBtnActive =
  'border-primary bg-primary text-primary-foreground';

export const aisSegmentBtnInactive =
  'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-primary';

export const aisBadgePrimary =
  'inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary';

export const aisBadgeNeutral =
  'inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground';

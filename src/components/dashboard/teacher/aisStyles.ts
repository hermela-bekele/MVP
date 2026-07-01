/** Academic Intelligence System — Tailwind utility bundles (always compiled) */

export const aisPage = 'w-full text-left';

/** Sidebar shell — gray surface, blue nav accents */
export const aisSidebarShell =
  'flex flex-col h-screen sticky top-0 shrink-0 bg-ais-surface-container-low border-r border-ais-card-border sidebar-transition overflow-hidden';

export const aisSidebarMobileShell =
  'fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] flex flex-col bg-ais-surface-container-low transition-transform duration-300 ease-out shadow-2xl lg:hidden';

export const aisSidebarBrand =
  'h-16 border-b border-ais-card-border flex items-center shrink-0 gap-2';

export const aisSidebarLogo =
  'h-9 w-9 rounded-lg bg-ais-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm';

export const aisSidebarBrandTitle = 'font-bold text-sm text-ais-on-surface truncate leading-tight';

export const aisSidebarBrandSubtitle =
  'text-[10px] text-ais-on-surface-variant font-medium truncate';

export const aisSidebarCollapseBtn =
  'hidden lg:flex p-1.5 rounded-md text-ais-on-surface-variant hover:text-ais-primary hover:bg-white/70 transition-all duration-200 cursor-pointer shrink-0';

export const aisSidebarSectionHeader =
  'text-[10px] font-bold uppercase tracking-widest text-ais-outline px-3 pt-4 pb-1 select-none';

export const aisSidebarSectionDivider = 'my-2 border-b border-ais-card-border';

export const aisSidebarNavItem =
  'w-full flex items-center rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer group';

export const aisSidebarNavItemActive =
  'bg-white text-ais-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisSidebarNavItemInactive =
  'text-ais-on-surface-variant hover:text-ais-primary hover:bg-white/70';

export const aisSidebarNavIconActive = 'shrink-0 text-ais-primary scale-105';

export const aisSidebarNavIconInactive =
  'shrink-0 text-ais-primary/70 group-hover:text-ais-primary opacity-90 group-hover:opacity-100';

export const aisSidebarBadge =
  'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ais-primary text-white text-[10px] font-bold px-1.5';

export const aisSidebarFooter = 'shrink-0 p-3 border-t border-ais-card-border';

export const aisSidebarLogoutBtn =
  'w-full flex items-center rounded-lg text-[13px] font-bold text-ais-error hover:bg-ais-error/10 hover:text-ais-error transition-all duration-200 cursor-pointer';

/** Top navbar — matches sidebar / portal surfaces */
export const aisNavbar =
  'h-14 border-b border-ais-card-border bg-ais-surface-container-low px-4 sm:px-5 lg:px-4 flex items-center justify-between sticky top-0 z-30 w-full';

export const aisNavbarIconBtn =
  'p-1.5 rounded-lg text-ais-on-surface-variant hover:text-ais-primary hover:bg-white/70 transition-colors cursor-pointer';

export const aisNavbarSearch =
  'w-full h-9 px-3 bg-white border border-ais-card-border rounded-lg text-xs text-ais-on-surface-variant flex items-center justify-between transition-all duration-200 group cursor-pointer hover:border-ais-primary/40 focus:outline-none focus:ring-2 focus:ring-ais-primary/20';

export const aisNavbarSearchKbd =
  'hidden lg:inline-flex items-center gap-0.5 rounded border border-ais-card-border bg-ais-surface-container-low px-1.5 py-0.5 font-mono text-[9px] font-bold text-ais-on-surface-variant select-none';

export const aisNavbarAvatar =
  'h-8 w-8 rounded-full bg-ais-primary text-white flex items-center justify-center font-bold text-xs shrink-0';

export const aisNavbarProfileBtn =
  'flex items-center space-x-2.5 hover:bg-white/70 p-1.5 rounded-lg transition-colors cursor-pointer';

export const aisNavbarProfileName = 'text-xs font-bold text-ais-on-surface';

export const aisNavbarProfileRole = 'text-[10px] text-ais-on-surface-variant';

export const aisNavbarDropdown =
  'absolute right-0 mt-2 bg-white border border-ais-card-border rounded-lg shadow-[0_4px_12px_rgba(15,23,42,0.08)] z-30 animate-fade-in';

export const aisNavbarOverlay = 'fixed inset-0 z-20';

export const aisNavbarNotifPanel =
  'absolute right-0 z-30 mt-2 flex w-[420px] max-w-[calc(100vw-2rem)] max-h-[32rem] flex-col overflow-hidden rounded-xl border border-ais-card-border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] animate-fade-in';

export const aisNavbarNotifHeader =
  'flex shrink-0 items-center justify-between border-b border-ais-card-border bg-ais-surface-container-low/40 px-4 py-3';

export const aisNavbarNotifFilters =
  'flex shrink-0 gap-1 border-b border-ais-card-border bg-ais-surface-container-low/20 px-3 py-2';

export const aisNavbarNotifFilterBtn =
  'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors';

export const aisNavbarNotifFilterBtnActive =
  'bg-white text-ais-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisNavbarNotifFilterBtnInactive =
  'text-ais-on-surface-variant hover:bg-white/70 hover:text-ais-primary';

export const aisNavbarNotifSectionHeader =
  'bg-ais-surface-container-low/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ais-outline border-b border-ais-card-border';

export const aisNavbarNotifList =
  'scrollbar-none flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const aisNavbarNotifItem =
  'group relative border-b border-ais-row-border px-4 py-4 transition-colors last:border-b-0 hover:bg-ais-row-hover';

export const aisNavbarNotifItemUnread =
  'bg-ais-surface-container-low/60 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-r-full before:bg-ais-primary';

export const aisNavbarNotifItemInner = 'flex gap-3 pl-1';

export const aisNavbarNotifIconWrap =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border';

export const aisNavbarNotifIconAlert =
  'border-ais-error/20 bg-ais-error/10 text-ais-error';

export const aisNavbarNotifIconSuccess =
  'border-ais-success/20 bg-ais-success/10 text-ais-success';

export const aisNavbarNotifIconRequest =
  'border-ais-primary/20 bg-ais-primary/10 text-ais-primary';

export const aisNavbarNotifIconInfo =
  'border-ais-card-border bg-ais-surface-container-low text-ais-on-surface-variant';

export const aisNavbarNotifActionBtn =
  'flex h-8 w-8 items-center justify-center rounded-lg text-ais-on-surface-variant transition-colors hover:bg-white hover:text-ais-primary cursor-pointer';

export const aisNavbarNotifActionBtnDanger =
  'flex h-8 w-8 items-center justify-center rounded-lg text-ais-on-surface-variant transition-colors hover:bg-ais-error/10 hover:text-ais-error cursor-pointer';

export const aisNavbarNotifFooterBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-ais-card-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-ais-primary transition-colors hover:border-ais-primary/30 hover:bg-ais-surface-container-low cursor-pointer';

export const aisNavbarNotifTypeRequest =
  'inline-flex rounded-lg bg-ais-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ais-primary';

export const aisNavbarNotifTypeAlert =
  'inline-flex rounded-lg bg-ais-error/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ais-error';

export const aisNavbarNotifTypeSuccess =
  'inline-flex rounded-lg bg-ais-success/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ais-success';

export const aisNavbarNotifTypeInfo =
  'inline-flex rounded-lg border border-ais-card-border bg-ais-surface-container-low px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ais-on-surface-variant';

export const aisNavbarNotifBadge =
  'absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ais-error text-[9px] font-bold text-white';

export const aisNavbarDropdownItem =
  'w-full text-left px-3 py-2 text-xs text-ais-on-surface-variant hover:text-ais-primary hover:bg-ais-surface-container-low rounded-md transition-colors cursor-pointer';

/** Shared card shell — no accent strips, uniform radius, gray border */
export const aisCard =
  'rounded-lg border border-ais-card-border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisKpiCard = `${aisCard} flex min-h-[128px] flex-col justify-between p-6`;

export const aisKpiLabel =
  'text-xs font-bold uppercase leading-4 tracking-widest text-ais-primary';

export const aisKpiPill =
  'inline-flex items-center gap-1 rounded-full bg-ais-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-ais-on-surface-variant';

export const aisKpiPillSuccess =
  'inline-flex items-center gap-1 rounded-full bg-ais-success/10 px-2.5 py-1 text-[11px] font-semibold text-ais-success';

export const aisKpiPillError =
  'inline-flex items-center gap-1 rounded-full bg-ais-error/10 px-2.5 py-1 text-[11px] font-semibold text-ais-error';

export const aisUserBadge =
  'inline-flex items-center gap-2 rounded-full border border-ais-card-border bg-ais-surface-container-low pl-1 pr-3 py-1 text-sm font-semibold text-ais-on-surface';

export const aisUserBadgeAvatar =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ais-primary text-[11px] font-bold text-white';

export const aisKpiValue = 'text-3xl font-bold tabular-nums leading-none text-ais-on-surface';

export const aisStatTile = `${aisCard} p-4`;

export const aisAlertRow = `${aisCard} px-3 py-2`;

/** Student Activity — single panel with internal scroll */
export const aisActivityPanel =
  `${aisCard} flex max-h-[calc(100vh-14rem)] min-h-0 flex-col overflow-hidden`;

export const aisActivityPanelHeader =
  'shrink-0 border-b border-ais-card-border px-4 py-4';

export const aisActivityScroll =
  'scrollbar-none min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const aisActivityAlertRow =
  'rounded-md border border-ais-error/15 bg-ais-error/5 px-3 py-2';

export const aisActivityStudentRow =
  'rounded-md border border-ais-card-border bg-ais-surface-container-low/50 p-4';

export const aisSchedulePanel =
  `${aisCard} flex min-h-0 flex-1 flex-col overflow-hidden`;

export const aisScheduleFilterBtn =
  'w-full rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors';

export const aisScheduleFilterBtnActive =
  'bg-white text-ais-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisScheduleFilterBtnInactive =
  'text-ais-on-surface-variant hover:bg-white/70 hover:text-ais-primary';

export const aisScheduleListRow =
  'flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ais-row-border px-4 py-3 transition-colors last:border-b-0 hover:bg-ais-row-hover';

export const aisBtnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] shadow-md hover:shadow-lg';

export const aisBtnSecondary =
  'inline-flex items-center gap-2 rounded-lg border border-ais-outline-variant bg-white px-4 py-2 text-sm font-medium text-ais-on-surface-variant transition-colors hover:bg-ais-surface-container-low';

export const aisBtnGhost =
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ais-primary transition-colors hover:text-[#003ea8]';

export const aisBtnGhostMuted =
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ais-on-surface-variant transition-colors hover:text-ais-on-surface';

export const aisBadgeSuccess =
  'inline-flex items-center gap-1 rounded-lg bg-ais-success/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ais-success';

export const aisBadgeWarning =
  'inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-600';

export const aisBadgeError =
  'inline-flex items-center gap-1 rounded-lg bg-ais-error/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ais-error';

export const aisLabelCaps =
  'text-[11px] font-bold uppercase leading-4 tracking-widest text-ais-on-surface-variant';

export const aisDisplayMd = 'text-2xl font-semibold tracking-tight text-ais-on-surface';

export const aisHeadlineSm = 'text-xl font-semibold text-ais-on-surface';

export const aisDataLg = 'text-lg font-semibold tabular-nums text-ais-on-surface';

export const aisDataMd = 'text-sm font-medium tabular-nums text-ais-on-surface';

export const aisBodyMd = 'text-sm leading-5 text-ais-on-surface-variant';

export const aisBodySm = 'text-xs leading-4 text-ais-on-surface-variant';

/** Form controls */
export const aisInput =
  'w-full h-10 px-3 rounded-lg border border-ais-card-border bg-white text-sm text-ais-on-surface placeholder:text-ais-on-surface-variant focus:outline-none focus:ring-2 focus:ring-ais-primary/20 focus:border-ais-primary/40 transition-colors';

export const aisTextarea =
  'w-full min-h-[6rem] px-3 py-2 rounded-lg border border-ais-card-border bg-white text-sm text-ais-on-surface placeholder:text-ais-on-surface-variant focus:outline-none focus:ring-2 focus:ring-ais-primary/20 focus:border-ais-primary/40 transition-colors';

export const aisFormLabel =
  'text-[10px] font-bold uppercase tracking-wider text-ais-on-surface-variant';

/** Sub-tab switcher (matches sidebar nav pills) */
export const aisSubTabTrack =
  'flex w-fit gap-1 rounded-lg border border-ais-card-border bg-ais-surface-container-low/40 p-1';

export const aisSubTabBtn =
  'rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer';

export const aisSubTabBtnActive =
  'bg-white text-ais-primary shadow-[0_1px_3px_rgba(15,23,42,0.05)]';

export const aisSubTabBtnInactive =
  'text-ais-on-surface-variant hover:text-ais-primary hover:bg-white/70';

/** Panel header */
export const aisPanelHeader =
  'flex flex-col gap-2 border-b border-ais-card-border p-4 sm:flex-row sm:items-start sm:justify-between';

/** List / form rows */
export const aisListRow =
  'rounded-lg border border-ais-card-border bg-ais-surface-container-low/50 p-4';

export const aisCallout =
  'rounded-lg border border-ais-primary/20 bg-ais-primary/5 p-3 text-xs text-ais-primary';

/** Segmented toggle (attendance etc.) */
export const aisSegmentBtn =
  'rounded-lg px-2.5 py-1 text-[10px] font-bold border cursor-pointer transition-colors';

export const aisSegmentBtnActive =
  'border-ais-primary bg-ais-primary text-white';

export const aisSegmentBtnInactive =
  'border-ais-card-border bg-white text-ais-on-surface-variant hover:border-ais-primary/30 hover:text-ais-primary';

export const aisBadgePrimary =
  'inline-flex items-center gap-1 rounded-lg bg-ais-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ais-primary';

export const aisBadgeNeutral =
  'inline-flex items-center gap-1 rounded-lg border border-ais-card-border bg-ais-surface-container-low px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ais-on-surface-variant';

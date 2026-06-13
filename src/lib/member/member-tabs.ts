export type MemberTab = "home" | "workouts" | "custom" | "profile";

export function tabFromSearchParam(value: string | null | undefined): MemberTab {
  if (value === "workouts") return "workouts";
  if (value === "custom") return "custom";
  if (value === "profile") return "profile";
  return "home";
}

export function tabToHref(tab: MemberTab): string {
  if (tab === "home") return "/member";
  return `/member?tab=${tab}`;
}

export function isMemberTabActive(pathname: string, tab: MemberTab, current: MemberTab): boolean {
  if (pathname !== "/member" && pathname !== "/member/") return false;
  return tab === current;
}

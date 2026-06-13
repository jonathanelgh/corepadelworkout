import { redirect } from "next/navigation";

export default function MemberCustomRedirect() {
  redirect("/member?tab=custom");
}

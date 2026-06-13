import { redirect } from "next/navigation";

export default function MemberProfileRedirect() {
  redirect("/member?tab=profile");
}

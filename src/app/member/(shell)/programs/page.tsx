import { redirect } from "next/navigation";

export default function MemberProgramsRedirect() {
  redirect("/member?tab=workouts");
}

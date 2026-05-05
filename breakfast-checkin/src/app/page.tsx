// Root page - redirects to the check-in page
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/backend/auth";

export default async function Home() {
  const staff = await getCurrentStaff();

  if (staff) {
    redirect("/home");
  } else {
    redirect("/login");
  }
}

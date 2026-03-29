import { redirect } from "next/navigation";

export default function CoveragePage() {
  redirect("/plants?tab=coverage");
}

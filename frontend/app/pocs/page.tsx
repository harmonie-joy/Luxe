import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/routes";

export default function PlaygroundPage() {
  redirect(APP_ROUTES.pocsHome);
}
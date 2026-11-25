import { notFound } from "next/navigation";
import SteamInspector from "./SteamInspector";

export const dynamic = "force-dynamic";

export default function SteamInspectionPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <SteamInspector />;
}

import type { ReactNode } from "react";
import { SettingsShell } from "./SettingsShell";
import { requireSessionUser } from "@/lib/requireSessionUser";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  await requireSessionUser("/settings");

  return <SettingsShell>{children}</SettingsShell>;
}

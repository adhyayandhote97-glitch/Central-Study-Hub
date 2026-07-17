"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { ClearHistoryButton } from "@/components/settings/clear-history-button";
import { LogoutButton } from "@/components/settings/logout-button";
import { SettingsRow } from "@/components/settings/settings-row";

export default function StudentSettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalise Central Study Hub on this device.</p>
      </div>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          <SettingsRow title="Appearance" description="Choose light, dark, or match your system.">
            <ThemeSelector />
          </SettingsRow>
          <SettingsRow
            title="Browsing history"
            description="Clear your Recently Viewed and download history on this device."
          >
            <ClearHistoryButton />
          </SettingsRow>
          <SettingsRow title="Session" description="Sign out of Central Study Hub on this device.">
            <LogoutButton />
          </SettingsRow>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-center text-xs text-muted-foreground">
        Central Study Hub · Victorious Kidss Educares · MYP5
      </p>
    </div>
  );
}

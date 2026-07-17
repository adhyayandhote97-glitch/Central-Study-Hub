"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { LogoutButton } from "@/components/settings/logout-button";
import { SettingsRow } from "@/components/settings/settings-row";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin preferences for Central Study Hub.</p>
      </div>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          <SettingsRow title="Appearance" description="Choose light, dark, or match your system.">
            <ThemeSelector />
          </SettingsRow>
          <SettingsRow title="Role" description="You're signed in with full administrator access.">
            <Badge variant="secondary">Administrator</Badge>
          </SettingsRow>
          <SettingsRow title="Session" description="Sign out of the admin console.">
            <LogoutButton />
          </SettingsRow>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Access keys</p>
          <p>
            Student and admin access keys are configured through environment variables
            (<code className="rounded bg-muted px-1 py-0.5 text-xs">STUDENT_ACCESS_KEY</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">ADMIN_ACCESS_KEY</code>). To rotate a
            key, update the environment variable and redeploy. See the project README.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

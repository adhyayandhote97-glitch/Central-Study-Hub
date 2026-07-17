"use client";

import * as React from "react";
import { Loader2, Megaphone, Pin, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { useAnnouncements } from "@/hooks/use-announcements";
import { formatRelativeTime } from "@/lib/format-date";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Announcement } from "@/types/announcement";

export default function AdminAnnouncementsPage() {
  const { announcements, loading, refetch } = useAnnouncements({ all: true });
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [pinned, setPinned] = React.useState(false);
  const [expiresAt, setExpiresAt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ title?: string; body?: string }>({});
  const [deleting, setDeleting] = React.useState<Announcement | null>(null);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Title is required.";
    if (!body.trim()) next.body = "Message is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          pinned,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't post announcement.");
      toast.success("Announcement posted.");
      setTitle("");
      setBody("");
      setPinned(false);
      setExpiresAt("");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't post announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePin = async (announcement: Announcement) => {
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !announcement.pinned }),
      });
      if (!res.ok) throw new Error();
      refetch();
    } catch {
      toast.error("Couldn't update announcement.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/announcements/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Announcement deleted.");
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Couldn't delete announcement.");
    }
  };

  const isExpired = (a: Announcement) => a.expiresAt && new Date(a.expiresAt).getTime() < Date.now();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Post updates for students. Pinned announcements appear on the student homepage.
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={Boolean(errors.title)} />
              {errors.title && <p role="alert" className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={Boolean(errors.body)} />
              {errors.body && <p role="alert" className="text-sm text-destructive">{errors.body}</p>}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="expiresAt">Expiry (optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-auto"
                />
              </div>
              <label className="flex items-center gap-2 pb-1.5 text-sm">
                <Switch checked={pinned} onCheckedChange={setPinned} aria-label="Pin to homepage" />
                <span className="font-medium text-foreground">Pin to homepage</span>
              </label>
              <Button type="submit" disabled={submitting} className="ml-auto">
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Posted</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState icon={Megaphone} title="No announcements yet" description="Post your first update above." />
        ) : (
          announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    {a.pinned && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Pin className="size-2.5" aria-hidden="true" /> Pinned
                      </Badge>
                    )}
                    {isExpired(a) && (
                      <Badge variant="outline" className="text-[10px]">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => togglePin(a)}
                    aria-label={a.pinned ? "Unpin announcement" : "Pin announcement"}
                  >
                    <Pin className={a.pinned ? "size-4 text-primary" : "size-4"} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(a)}
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be removed for everyone. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

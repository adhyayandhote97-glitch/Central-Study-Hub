"use client";

import * as React from "react";
import { Lightbulb, Brain, Loader2, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { useAllFacts, useStudyTips } from "@/hooks/use-homepage-content";
import { DAILY_FACT_TYPES, STUDY_TIP_CATEGORIES } from "@/lib/constants";
import type { DailyFactType, StudyTipCategory } from "@/types/homepage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FactManager() {
  const { facts, loading, refetch } = useAllFacts();
  const [type, setType] = React.useState<DailyFactType>("fact");
  const [text, setText] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/daily-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text: text.trim(), author: author.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed.");
      toast.success("Added.");
      setText("");
      setAuthor("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/daily-facts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    refetch();
  };

  const remove = async (id: string) => {
    await fetch(`/api/daily-facts/${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Lightbulb className="size-4.5 text-muted-foreground" aria-hidden="true" />
          Fact of the Day
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Academic facts, motivational quotes and study tips. One active item is shown each day, rotating daily.
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={add} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="space-y-1.5 sm:w-56">
                <Label htmlFor="fact-type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as DailyFactType)}>
                  <SelectTrigger id="fact-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAILY_FACT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="fact-author">Author / source (optional)</Label>
                <Input id="fact-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fact-text">Text</Label>
              <Textarea id="fact-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="self-end">
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-20 rounded-md" />
      ) : facts.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No facts yet" description="Add your first one above." />
      ) : (
        <div className="flex flex-col gap-2">
          {facts.map((fact) => (
            <div
              key={fact.id}
              className="flex items-start gap-3 rounded-md bg-card p-3 ring-1 ring-foreground/[0.08]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">
                    {DAILY_FACT_TYPES.find((t) => t.value === fact.type)?.label}
                  </Badge>
                  {!fact.active && <Badge variant="outline">Hidden</Badge>}
                </div>
                <p className="mt-1.5 text-sm text-foreground">{fact.text}</p>
                {fact.author && <p className="text-xs text-muted-foreground">{fact.author}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={fact.active}
                  onCheckedChange={(v) => toggle(fact.id, v)}
                  aria-label={fact.active ? "Hide" : "Show"}
                />
                <Button variant="ghost" size="icon-sm" onClick={() => remove(fact.id)} aria-label="Delete">
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StudyTipManager() {
  const { tips, loading, refetch } = useStudyTips({ all: true });
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [category, setCategory] = React.useState<StudyTipCategory>("revision");
  const [submitting, setSubmitting] = React.useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/study-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed.");
      toast.success("Added.");
      setTitle("");
      setBody("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/study-tips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    refetch();
  };

  const remove = async (id: string) => {
    await fetch(`/api/study-tips/${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Brain className="size-4.5 text-muted-foreground" aria-hidden="true" />
          How to Study
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revision advice, exam strategies, productivity techniques and study methods for the homepage.
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={add} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="tip-title">Title</Label>
                <Input id="tip-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:w-56">
                <Label htmlFor="tip-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as StudyTipCategory)}>
                  <SelectTrigger id="tip-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_TIP_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tip-body">Details</Label>
              <Textarea id="tip-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="self-end">
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-20 rounded-md" />
      ) : tips.length === 0 ? (
        <EmptyState icon={Brain} title="No study tips yet" description="Add your first one above." />
      ) : (
        <div className="flex flex-col gap-2">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="flex items-start gap-3 rounded-md bg-card p-3 ring-1 ring-foreground/[0.08]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">{tip.title}</span>
                  <Badge variant="secondary">
                    {STUDY_TIP_CATEGORIES.find((c) => c.value === tip.category)?.label}
                  </Badge>
                  {!tip.active && <Badge variant="outline">Hidden</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{tip.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={tip.active}
                  onCheckedChange={(v) => toggle(tip.id, v)}
                  aria-label={tip.active ? "Hide" : "Show"}
                />
                <Button variant="ghost" size="icon-sm" onClick={() => remove(tip.id)} aria-label="Delete">
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminHomepagePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Homepage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the Fact of the Day and How to Study sections students see first.
        </p>
      </div>
      <FactManager />
      <StudyTipManager />
    </div>
  );
}

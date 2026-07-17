"use client";

import * as React from "react";
import { Loader2, Plus, X } from "@/components/icons";
import { toast } from "sonner";
import type { Subject } from "@/types/subject";
import { getSubjectIcon } from "@/lib/subject-icon-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function SubjectRow({ subject, onChanged }: { subject: Subject; onChanged: () => void }) {
  const Icon = getSubjectIcon(subject.icon);
  const [newTopic, setNewTopic] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [removingSlug, setRemovingSlug] = React.useState<string | null>(null);

  const addTopic = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newTopic.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add topic.");
      setNewTopic("");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add topic.");
    } finally {
      setAdding(false);
    }
  };

  const removeTopic = async (slug: string) => {
    setRemovingSlug(slug);
    try {
      const res = await fetch(`/api/subjects/${subject.id}/topics/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Couldn't remove topic.");
      }
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove topic.");
    } finally {
      setRemovingSlug(null);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-foreground">{subject.name}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {subject.topics.length === 0 && (
            <span className="text-xs text-muted-foreground">No topics yet.</span>
          )}
          {subject.topics
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((topic) => (
              <Badge key={topic.slug} variant="secondary" className="gap-1 pr-1">
                {topic.name}
                <button
                  type="button"
                  onClick={() => removeTopic(topic.slug)}
                  disabled={removingSlug === topic.slug}
                  aria-label={`Remove topic ${topic.name}`}
                  className="rounded-sm text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {removingSlug === topic.slug ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <X className="size-3" aria-hidden="true" />
                  )}
                </button>
              </Badge>
            ))}
        </div>

        <form onSubmit={addTopic} className="flex items-center gap-2">
          <Input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Add a topic…"
            aria-label={`Add a topic to ${subject.name}`}
            className="h-8"
          />
          <Button type="submit" size="sm" variant="outline" disabled={adding || !newTopic.trim()}>
            {adding ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SubjectTopicManager({ subjects, onChanged }: { subjects: Subject[]; onChanged: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {subjects.map((subject) => (
        <SubjectRow key={subject.id} subject={subject} onChanged={onChanged} />
      ))}
    </div>
  );
}

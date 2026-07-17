"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Paperclip, X } from "@/components/icons";
import { toast } from "sonner";
import { ticketInputSchema, type TicketInputPayload } from "@/lib/validation/ticketSchema";
import { TICKET_PRIORITIES, TICKET_TYPES } from "@/lib/constants";
import { useSubjects } from "@/hooks/use-subjects";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketConfirmation } from "./ticket-confirmation";

export function TicketForm() {
  const { subjects } = useSubjects();
  const { attachment, uploading, error: uploadError, upload, clear: clearAttachment } = useAttachmentUpload();
  const [submitted, setSubmitted] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketInputPayload>({
    resolver: zodResolver(ticketInputSchema),
    defaultValues: {
      type: "suggestion",
      name: "",
      isAnonymous: false,
      subjectId: null,
      title: "",
      description: "",
      priority: "medium",
      attachmentUrl: null,
      attachmentPath: null,
    },
  });

  const isAnonymous = watch("isAnonymous");

  const onSubmit = async (values: TicketInputPayload) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          subjectId: values.subjectId || null,
          attachmentUrl: attachment?.attachmentUrl ?? null,
          attachmentPath: attachment?.attachmentPath ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't submit your ticket.");

      setSubmitted(true);
      reset();
      clearAttachment();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't submit your ticket.");
    }
  };

  if (submitted) {
    return <TicketConfirmation onSubmitAnother={() => setSubmitted(false)} />;
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Category</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subjectId">Subject</Label>
          <Controller
            control={control}
            name="subjectId"
            render={({ field }) => (
              <Select value={field.value ?? "general"} onValueChange={(v) => field.onChange(v === "general" ? null : v)}>
                <SelectTrigger id="subjectId" className="w-full">
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" aria-invalid={Boolean(errors.title)} {...register("title")} />
        {errors.title && (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        {errors.description && (
          <p role="alert" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="isAnonymous"
          render={({ field }) => (
            <Checkbox
              id="isAnonymous"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="isAnonymous" className="font-normal">
          Submit anonymously
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Your name {isAnonymous ? "(hidden, submitting anonymously)" : "(optional)"}</Label>
        <Input id="name" disabled={isAnonymous} {...register("name")} />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Attachment (optional)</Label>
        {attachment ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="flex-1 truncate">{attachment.fileName}</span>
            <button
              type="button"
              onClick={clearAttachment}
              className="rounded-sm text-muted-foreground hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              aria-label="Remove attachment"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              id="attachment"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) upload(file);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Paperclip className="size-4" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : "Attach a file"}
            </Button>
            <span className="text-xs text-muted-foreground">Up to 25MB</span>
          </div>
        )}
        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting || uploading} className="w-full sm:w-auto">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Submit
      </Button>
    </motion.form>
  );
}

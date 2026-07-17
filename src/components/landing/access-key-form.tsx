"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Loader2 } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { accessKeySchema, type AccessKeyFormValues } from "@/lib/validation/authSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccessKeyForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showKey, setShowKey] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success">("idle");
  const shakeControls = useAnimation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AccessKeyFormValues>({
    resolver: zodResolver(accessKeySchema),
    defaultValues: { passkey: "" },
  });

  const onSubmit = async (values: AccessKeyFormValues) => {
    try {
      const { role } = await login(values.passkey);
      setStatus("success");
      const next = searchParams.get("next");
      await new Promise((resolve) => setTimeout(resolve, 650));
      if (role === "admin") {
        router.push(next && next.startsWith("/admin") ? next : "/admin");
      } else {
        router.push(next && next.startsWith("/dashboard") ? next : "/dashboard");
      }
    } catch (error) {
      shakeControls.start({ x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.4 } });
      setError("passkey", {
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  };

  return (
    <div className="w-full max-w-sm rounded-md bg-card p-6 shadow-md ring-1 ring-foreground/[0.08]">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-3 py-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground"
            >
              <Check className="size-7" aria-hidden="true" />
            </motion.div>
            <p className="text-sm font-medium text-foreground">Access granted</p>
            <p className="text-sm text-muted-foreground">Taking you in…</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={shakeControls}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="passkey">Access key</Label>
              <div className="relative">
                <KeyRound
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="passkey"
                  type={showKey ? "text" : "password"}
                  autoComplete="off"
                  placeholder="Enter your access key"
                  aria-invalid={Boolean(errors.passkey)}
                  aria-describedby={errors.passkey ? "passkey-error" : undefined}
                  className="h-12 pr-11 pl-10 text-base"
                  {...register("passkey")}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  aria-label={showKey ? "Hide access key" : "Show access key"}
                >
                  {showKey ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="min-h-5">
                <AnimatePresence>
                  {errors.passkey && (
                    <motion.p
                      id="passkey-error"
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-destructive"
                    >
                      {errors.passkey.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="mt-2 h-12 w-full text-base font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                <>
                  Enter Study Hub
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

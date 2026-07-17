import { z } from "zod";

export const accessKeySchema = z.object({
  passkey: z.string().min(1, "Enter your access key."),
});

export type AccessKeyFormValues = z.infer<typeof accessKeySchema>;

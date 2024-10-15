import { z } from "zod";

export const authenSchema = z.object({
  email: z.string().email(),
  loading: z.boolean(),
  success: z.boolean(),
  fail: z.boolean(),
  name: z.string(),
  organization: z.string(),
  faceStep: z.boolean(),
  ModelsLoaded: z.boolean(),
  faceDirection: z.string(),
  lookingFor: z.string(),
});

export type AuthenticatorSchema = z.infer<typeof authenSchema>;

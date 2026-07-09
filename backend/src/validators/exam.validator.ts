import { z } from "zod";

export const examSchema = z.object({
  name: z.string().min(3),
  code: z.string().min(3),
  department: z.string().min(2),
  durationMinutes: z.number().int().positive(),
  maximumMarks: z.number().positive(),
  passingMarks: z.number().positive(),
  negativeMarking: z.boolean().default(false),
  languages: z.array(z.string()).default(["English"])
});

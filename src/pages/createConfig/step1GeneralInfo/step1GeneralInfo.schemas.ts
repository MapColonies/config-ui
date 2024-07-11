import { z } from 'zod';

const schemaIdRegex = /^https:\/\/mapcolonies\.com\/.*/;

export const generalInfoFormSchema = z.object({
  configName: z.string().min(1).max(50),
  schemaId: z.string().min(1).regex(schemaIdRegex, 'Schema Id must start with https://mapcolonies.com/'),
  description: z.string().optional(),
});

export type GeneralInfoForm = z.infer<typeof generalInfoFormSchema>;

import { z } from 'zod';

export type schemaTree = Array<schemaTreeItem | schemaTreeDir>;

export type schemaTreeItem = {
  name?: string;
  id?: string;
};

export type schemaTreeDir = {
  children?: schemaTree;
  name?: string;
};

export const schemaTreeItemSchema = z.object({
  name: z.string().optional(),
  id: z.string().optional(),
});

const schemaTreeSchema = z.lazy(() => z.array(z.union([schemaTreeItemSchema, schemaTreeDirSchema])));

const schemaTreeDirSchema = z.lazy(() =>
  z.object({
    children: schemaTreeSchema.optional(),
    name: z.string().optional(),
  })
);
const schemaSelectOptionSchema = z.object({
  title: z.string(),
  id: z.string(),
  group: z.string(),
});

const schemaSelectValueSchema = z.object({
  topLevel: schemaTreeDirSchema.nullable(),
  midLevel: schemaTreeDirSchema.nullable(),
  schemaSelection: schemaSelectOptionSchema.nullable(),
});

export type SchemaSelectValue = z.infer<typeof schemaSelectValueSchema>;

const schemaIdRegex = /^https:\/\/mapcolonies\.com\/.*/;

export const generalInfoFormSchema = z.object({
  configName: z.string().min(1).max(50),
  version: z.preprocess((val) => parseInt(val as string), z.number().int().min(1)),
  schemaId: z.string().regex(schemaIdRegex, 'Schema Id must start with https://mapcolonies.com/'),
  description: z.string().optional(),
  createdBy: z.string().optional(),
  schemaSelect: schemaSelectValueSchema.optional(),
});

export type GeneralInfoForm = z.infer<typeof generalInfoFormSchema>;

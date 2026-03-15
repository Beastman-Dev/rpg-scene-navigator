import { z } from 'zod';

// Enum schemas
export const SceneTypeSchema = z.enum([
  'exploration',
  'social', 
  'combat',
  'travel',
  'investigation',
  'puzzle',
  'hazard',
  'transition',
  'revelation',
  'downtime',
  'climax',
  'other'
]);

export const AdventureStatusSchema = z.enum([
  'draft',
  'active',
  'archived',
  'completed'
]);

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Stat block schema
export const StatBlockSchema = z.object({
  system: z.string(),
  summary: z.string()
}).passthrough(); // Allow additional system-specific fields

// NPC schemas
export const SceneNpcRefSchema = z.object({
  npcId: z.string().uuid(),
  presenceRole: z.string().optional(),
  isHostile: z.boolean().optional(),
  notes: z.string().optional()
});

export const NPCSchema = BaseEntitySchema.extend({
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  description: z.string().optional(),
  faction: z.string().optional(),
  statBlock: StatBlockSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  adventureId: z.string().uuid()
});

// Exit option schema
export const ExitOptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, 'Label is required'),
  destinationSceneId: z.string().uuid(),
  conditionText: z.string().optional(),
  resultText: z.string().optional(),
  stateChanges: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).optional()
});

// Scene schemas
export const SceneSchema = BaseEntitySchema.extend({
  name: z.string().min(1, 'Scene name is required'),
  type: SceneTypeSchema,
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  gmDescription: z.string().optional(),
  readAloud: z.string().optional(),
  atmosphere: z.string().optional(),
  entryConditions: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  complications: z.array(z.string()).optional(),
  clues: z.array(z.string()).optional(),
  interactiveElements: z.array(z.string()).optional(),
  failureStates: z.array(z.string()).optional(),
  successStates: z.array(z.string()).optional(),
  rewards: z.array(z.string()).optional(),
  factions: z.array(z.string()).optional(),
  sceneNpcRefs: z.array(SceneNpcRefSchema).optional(),
  exitOptions: z.array(ExitOptionSchema).min(1, 'At least one exit option is required'),
  canEndSessionHere: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  adventureId: z.string().uuid()
});

// Adventure schemas
export const AdventureSchema = BaseEntitySchema.extend({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startingSceneId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
  status: AdventureStatusSchema,
  author: z.string().optional()
});

// Session schemas
export const SceneRunStateSchema = z.object({
  sceneId: z.string().uuid(),
  enteredAt: z.string().datetime().optional(),
  exitedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  playerDecisions: z.array(z.string()).optional(),
  outcome: z.string().optional(),
  chosenExitOptionId: z.string().uuid().optional(),
  unresolvedThreads: z.array(z.string()).optional(),
  loreUpdates: z.array(z.string()).optional(),
  npcStateChanges: z.array(z.string()).optional(),
  lootAndRewards: z.array(z.string()).optional(),
  worldStateChanges: z.array(z.string()).optional()
});

export const SessionSchema = BaseEntitySchema.extend({
  adventureId: z.string().uuid(),
  sessionNumber: z.number().int().min(1),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  startingSceneId: z.string().uuid(),
  currentSceneId: z.string().uuid(),
  endingSceneId: z.string().uuid().optional(),
  isAdventureComplete: z.boolean(),
  summary: z.string().optional()
});

// Summary schemas
export const AdventureSummarySchema = z.object({
  id: z.string().uuid(),
  adventureId: z.string().uuid(),
  summaryText: z.string(),
  loreUpdateText: z.string().optional(),
  generatedAt: z.string().datetime()
});

// JSON file format schemas
export const AdventureFileSchema = z.object({
  schemaVersion: z.string(),
  fileType: z.literal('adventure'),
  adventure: z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    startingSceneId: z.string().uuid(),
    tags: z.array(z.string()).optional(),
    status: AdventureStatusSchema,
    author: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
  }),
  npcs: z.array(NPCSchema),
  scenes: z.array(SceneSchema)
});

export const SessionFileSchema = z.object({
  schemaVersion: z.string(),
  fileType: z.literal('session'),
  session: z.object({
    id: z.string().uuid(),
    adventureId: z.string().uuid(),
    sessionNumber: z.number().int().min(1),
    startedAt: z.string().datetime().optional(),
    endedAt: z.string().datetime().optional(),
    startingSceneId: z.string().uuid(),
    currentSceneId: z.string().uuid(),
    endingSceneId: z.string().uuid().optional(),
    isAdventureComplete: z.boolean(),
    summary: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
  }),
  sceneRunStates: z.array(SceneRunStateSchema)
});

// Form schemas (for form validation)
export const AdventureFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()),
  status: AdventureStatusSchema,
  author: z.string().optional()
});

export const SceneFormSchema = z.object({
  name: z.string().min(1, 'Scene name is required'),
  type: SceneTypeSchema,
  location: z.string().optional(),
  tags: z.array(z.string()),
  summary: z.string().optional(),
  gmDescription: z.string().optional(),
  readAloud: z.string().optional(),
  atmosphere: z.string().optional(),
  entryConditions: z.array(z.string()),
  objectives: z.array(z.string()),
  complications: z.array(z.string()),
  clues: z.array(z.string()),
  interactiveElements: z.array(z.string()),
  failureStates: z.array(z.string()),
  successStates: z.array(z.string()),
  rewards: z.array(z.string()),
  factions: z.array(z.string()),
  canEndSessionHere: z.boolean(),
  sortOrder: z.number().int().min(0)
});

export const NPCFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  description: z.string().optional(),
  faction: z.string().optional(),
  statBlock: StatBlockSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string())
});

export const ExitOptionFormSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  destinationSceneId: z.string().uuid(),
  conditionText: z.string().optional(),
  resultText: z.string().optional(),
  stateChanges: z.array(z.string()),
  sortOrder: z.number().int().min(0)
});

// Validation utility functions
export const validateAdventure = (data: unknown) => {
  return AdventureSchema.safeParse(data);
};

export const validateScene = (data: unknown) => {
  return SceneSchema.safeParse(data);
};

export const validateNPC = (data: unknown) => {
  return NPCSchema.safeParse(data);
};

export const validateExitOption = (data: unknown) => {
  return ExitOptionSchema.safeParse(data);
};

export const validateSession = (data: unknown) => {
  return SessionSchema.safeParse(data);
};

export const validateAdventureFile = (data: unknown) => {
  return AdventureFileSchema.safeParse(data);
};

export const validateSessionFile = (data: unknown) => {
  return SessionFileSchema.safeParse(data);
};

// Form validation functions
export const validateAdventureForm = (data: unknown) => {
  return AdventureFormSchema.safeParse(data);
};

export const validateSceneForm = (data: unknown) => {
  return SceneFormSchema.safeParse(data);
};

export const validateNPCForm = (data: unknown) => {
  return NPCFormSchema.safeParse(data);
};

export const validateExitOptionForm = (data: unknown) => {
  return ExitOptionFormSchema.safeParse(data);
};

// Type exports
export type SceneType = z.infer<typeof SceneTypeSchema>;
export type AdventureStatus = z.infer<typeof AdventureStatusSchema>;
export type StatBlock = z.infer<typeof StatBlockSchema>;
export type SceneNpcRef = z.infer<typeof SceneNpcRefSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type ExitOption = z.infer<typeof ExitOptionSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Adventure = z.infer<typeof AdventureSchema>;
export type SceneRunState = z.infer<typeof SceneRunStateSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AdventureSummary = z.infer<typeof AdventureSummarySchema>;
export type AdventureFile = z.infer<typeof AdventureFileSchema>;
export type SessionFile = z.infer<typeof SessionFileSchema>;
export type AdventureFormData = z.infer<typeof AdventureFormSchema>;
export type SceneFormData = z.infer<typeof SceneFormSchema>;
export type NPCFormData = z.infer<typeof NPCFormSchema>;
export type ExitOptionFormData = z.infer<typeof ExitOptionFormSchema>;

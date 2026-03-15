// Core domain types for RPG Scene Navigator

export type SceneType = 
  | 'exploration'
  | 'social'
  | 'combat'
  | 'travel'
  | 'investigation'
  | 'puzzle'
  | 'hazard'
  | 'transition'
  | 'revelation'
  | 'downtime'
  | 'climax'
  | 'other';

export type AdventureStatus = 
  | 'draft'
  | 'active'
  | 'archived'
  | 'completed';

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Adventure types
export interface Adventure extends BaseEntity {
  title: string;
  description?: string;
  startingSceneId: string;
  tags?: string[];
  status: AdventureStatus;
  author?: string;
}

// NPC types
export interface NPC extends BaseEntity {
  name: string;
  role?: string;
  description?: string;
  faction?: string;
  statBlock?: StatBlock;
  notes?: string;
  tags?: string[];
  adventureId: string;
}

export interface StatBlock {
  system: string;
  summary: string;
  [key: string]: any; // Allow system-specific fields
}

// Scene types
export interface Scene extends BaseEntity {
  name: string;
  type: SceneType;
  location?: string;
  tags?: string[];
  summary?: string;
  gmDescription?: string;
  readAloud?: string;
  atmosphere?: string;
  entryConditions?: string[];
  objectives?: string[];
  complications?: string[];
  clues?: string[];
  interactiveElements?: string[];
  failureStates?: string[];
  successStates?: string[];
  rewards?: string[];
  factions?: string[];
  sceneNpcRefs?: SceneNpcRef[];
  exitOptions: ExitOption[];
  canEndSessionHere?: boolean;
  sortOrder?: number;
  adventureId: string;
}

// Scene-NPC relationship
export interface SceneNpcRef {
  npcId: string;
  presenceRole?: string;
  isHostile?: boolean;
  notes?: string;
}

// Exit options for scene branching
export interface ExitOption {
  id: string;
  label: string;
  destinationSceneId: string;
  conditionText?: string;
  resultText?: string;
  stateChanges?: string[];
  sortOrder?: number;
}

// Session tracking types
export interface Session extends BaseEntity {
  adventureId: string;
  sessionNumber: number;
  startedAt?: string;
  endedAt?: string;
  startingSceneId: string;
  currentSceneId: string;
  endingSceneId?: string;
  isAdventureComplete: boolean;
  summary?: string;
}

export interface SceneRunState {
  sceneId: string;
  enteredAt?: string;
  exitedAt?: string;
  notes?: string;
  playerDecisions?: string[];
  outcome?: string;
  chosenExitOptionId?: string;
  unresolvedThreads?: string[];
  loreUpdates?: string[];
  npcStateChanges?: string[];
  lootAndRewards?: string[];
  worldStateChanges?: string[];
}

// Summary types
export interface AdventureSummary {
  id: string;
  adventureId: string;
  summaryText: string;
  loreUpdateText?: string;
  generatedAt: string;
}

// JSON file format types
export interface AdventureFile {
  schemaVersion: string;
  fileType: 'adventure';
  adventure: Omit<Adventure, 'id' | 'createdAt' | 'updatedAt'> & {
    id: string;
    createdAt?: string;
    updatedAt?: string;
  };
  npcs: NPC[];
  scenes: Scene[];
}

export interface SessionFile {
  schemaVersion: string;
  fileType: 'session';
  session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'> & {
    id: string;
    createdAt?: string;
    updatedAt?: string;
  };
  sceneRunStates: SceneRunState[];
}

// Repository return types
export interface CreateResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface FindResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FindAllResult<T> {
  success: boolean;
  data?: T[];
  error?: string;
}

// Database connection types
export interface DatabaseConnection {
  close(): void;
  prepare(sql: string): Statement;
  exec(sql: string): void;
}

export interface Statement {
  run(...params: any[]): { lastInsertRowid: number; changes: number };
  get(...params: any[]): any;
  all(...params: any[]): any[];
  finalize(): void;
}

// UI state types
export interface AppState {
  currentAdventure?: Adventure;
  currentScene?: Scene;
  isPlaying: boolean;
  currentSession?: Session;
  sceneRunStates: Map<string, SceneRunState>;
}

// Form types
export interface AdventureFormData {
  title: string;
  description: string;
  tags: string[];
  status: AdventureStatus;
  author: string;
}

export interface SceneFormData {
  name: string;
  type: SceneType;
  location: string;
  tags: string[];
  summary: string;
  gmDescription: string;
  readAloud: string;
  atmosphere: string;
  entryConditions: string[];
  objectives: string[];
  complications: string[];
  clues: string[];
  interactiveElements: string[];
  failureStates: string[];
  successStates: string[];
  rewards: string[];
  factions: string[];
  canEndSessionHere: boolean;
  sortOrder: number;
}

export interface NPCFormData {
  name: string;
  role: string;
  description: string;
  faction: string;
  statBlock: StatBlock;
  notes: string;
  tags: string[];
}

export interface ExitOptionFormData {
  label: string;
  destinationSceneId: string;
  conditionText: string;
  resultText: string;
  stateChanges: string[];
  sortOrder: number;
}

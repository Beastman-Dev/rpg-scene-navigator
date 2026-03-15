// SQLite database schema for RPG Scene Navigator

export const SCHEMA_VERSION = '1.0';

// SQL statements for creating tables
export const CREATE_TABLES_SQL = `
-- Adventures table
CREATE TABLE IF NOT EXISTS adventures (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    starting_scene_id TEXT NOT NULL,
    tags TEXT, -- JSON array
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived', 'completed')),
    author TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- NPCs table
CREATE TABLE IF NOT EXISTS npcs (
    id TEXT PRIMARY KEY,
    adventure_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    description TEXT,
    faction TEXT,
    stat_block TEXT, -- JSON object
    notes TEXT,
    tags TEXT, -- JSON array
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    adventure_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'exploration', 'social', 'combat', 'travel', 'investigation', 
        'puzzle', 'hazard', 'transition', 'revelation', 'downtime', 'climax', 'other'
    )),
    location TEXT,
    tags TEXT, -- JSON array
    summary TEXT,
    gm_description TEXT,
    read_aloud TEXT,
    atmosphere TEXT,
    entry_conditions TEXT, -- JSON array
    objectives TEXT, -- JSON array
    complications TEXT, -- JSON array
    clues TEXT, -- JSON array
    interactive_elements TEXT, -- JSON array
    failure_states TEXT, -- JSON array
    success_states TEXT, -- JSON array
    rewards TEXT, -- JSON array
    factions TEXT, -- JSON array
    can_end_session_here INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
);

-- Scene-NPC relationship table
CREATE TABLE IF NOT EXISTS scene_npcs (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    npc_id TEXT NOT NULL,
    presence_role TEXT,
    is_hostile INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,
    UNIQUE(scene_id, npc_id)
);

-- Exit options table
CREATE TABLE IF NOT EXISTS exit_options (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    label TEXT NOT NULL,
    destination_scene_id TEXT NOT NULL,
    condition_text TEXT,
    result_text TEXT,
    state_changes TEXT, -- JSON array
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_scene_id) REFERENCES scenes(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    adventure_id TEXT NOT NULL,
    session_number INTEGER NOT NULL,
    started_at TEXT,
    ended_at TEXT,
    starting_scene_id TEXT NOT NULL,
    current_scene_id TEXT NOT NULL,
    ending_scene_id TEXT,
    is_adventure_complete INTEGER DEFAULT 0,
    summary TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE,
    FOREIGN KEY (starting_scene_id) REFERENCES scenes(id),
    FOREIGN KEY (current_scene_id) REFERENCES scenes(id),
    FOREIGN KEY (ending_scene_id) REFERENCES scenes(id)
);

-- Scene run states table
CREATE TABLE IF NOT EXISTS scene_run_states (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    entered_at TEXT,
    exited_at TEXT,
    notes TEXT,
    player_decisions TEXT, -- JSON array
    outcome TEXT,
    chosen_exit_option_id TEXT,
    unresolved_threads TEXT, -- JSON array
    lore_updates TEXT, -- JSON array
    npc_state_changes TEXT, -- JSON array
    loot_and_rewards TEXT, -- JSON array
    world_state_changes TEXT, -- JSON array
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (scene_id) REFERENCES scenes(id),
    FOREIGN KEY (chosen_exit_option_id) REFERENCES exit_options(id),
    UNIQUE(session_id, scene_id)
);

-- Adventure summaries table
CREATE TABLE IF NOT EXISTS adventure_summaries (
    id TEXT PRIMARY KEY,
    adventure_id TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    lore_update_text TEXT,
    generated_at TEXT NOT NULL,
    FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE
);

-- Schema metadata table
CREATE TABLE IF NOT EXISTS schema_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_adventures_status ON adventures(status);
CREATE INDEX IF NOT EXISTS idx_npcs_adventure_id ON npcs(adventure_id);
CREATE INDEX IF NOT EXISTS idx_scenes_adventure_id ON scenes(adventure_id);
CREATE INDEX IF NOT EXISTS idx_scenes_type ON scenes(type);
CREATE INDEX IF NOT EXISTS idx_scene_npcs_scene_id ON scene_npcs(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_npcs_npc_id ON scene_npcs(npc_id);
CREATE INDEX IF NOT EXISTS idx_exit_options_scene_id ON exit_options(scene_id);
CREATE INDEX IF NOT EXISTS idx_exit_options_destination_scene_id ON exit_options(destination_scene_id);
CREATE INDEX IF NOT EXISTS idx_sessions_adventure_id ON sessions(adventure_id);
CREATE INDEX IF NOT EXISTS idx_sessions_current_scene_id ON sessions(current_scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_run_states_session_id ON scene_run_states(session_id);
CREATE INDEX IF NOT EXISTS idx_scene_run_states_scene_id ON scene_run_states(scene_id);
CREATE INDEX IF NOT EXISTS idx_adventure_summaries_adventure_id ON adventure_summaries(adventure_id);
`;

// Insert schema version
export const INSERT_SCHEMA_VERSION_SQL = `
INSERT OR REPLACE INTO schema_metadata (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}');
`;

// Full schema initialization
export const INIT_SCHEMA_SQL = `
${CREATE_TABLES_SQL}
${INSERT_SCHEMA_VERSION_SQL}
`;

// Validation queries
export const VALIDATE_SCHEMA_SQL = `
SELECT value FROM schema_metadata WHERE key = 'schema_version';
`;

// Table cleanup (for testing/reset)
export const DROP_ALL_TABLES_SQL = `
DROP TABLE IF EXISTS adventure_summaries;
DROP TABLE IF EXISTS scene_run_states;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS exit_options;
DROP TABLE IF EXISTS scene_npcs;
DROP TABLE IF EXISTS scenes;
DROP TABLE IF EXISTS npcs;
DROP TABLE IF EXISTS adventures;
DROP TABLE IF EXISTS schema_metadata;
`;

// Utility functions for JSON handling
export const JSON_FIELDS = {
  adventures: ['tags'],
  npcs: ['stat_block', 'tags'],
  scenes: [
    'tags',
    'entry_conditions',
    'objectives', 
    'complications',
    'clues',
    'interactive_elements',
    'failure_states',
    'success_states',
    'rewards',
    'factions'
  ],
  exit_options: ['state_changes'],
  scene_run_states: [
    'player_decisions',
    'unresolved_threads',
    'lore_updates',
    'npc_state_changes',
    'loot_and_rewards',
    'world_state_changes'
  ]
} as const;

// Boolean field mappings (SQLite uses INTEGER for booleans)
export const BOOLEAN_FIELDS = {
  scenes: ['can_end_session_here'],
  scene_npcs: ['is_hostile'],
  sessions: ['is_adventure_complete']
} as const;

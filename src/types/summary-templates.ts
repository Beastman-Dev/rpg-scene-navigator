// @ts-nocheck
// Summary template system for generating adventure and session summaries

export interface SummaryTemplate {
  id: string;
  name: string;
  description: string;
  type: 'session' | 'adventure_completion' | 'character_development';
  template: string;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'list' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface TemplateData {
  adventureTitle: string;
  sessionNumber?: number;
  sessionDate: string;
  scenesVisited: string[];
  npcsEncountered: string[];
  playerDecisions: string[];
  duration: string;
  gmNotes?: string;
  loreUpdates?: string[];
  completionStatus?: 'in_progress' | 'completed' | 'abandoned';
  achievements?: string[];
  nextSteps?: string[];
}

export interface GeneratedSummary {
  id: string;
  templateId: string;
  adventureId: string;
  sessionId?: string;
  title: string;
  content: string;
  templateData: TemplateData;
  generatedAt: string;
  type: 'session' | 'adventure_completion' | 'character_development';
}

export interface SummarySection {
  title: string;
  content: string;
  order: number;
  type: 'text' | 'list' | 'metadata';
}

// Built-in template definitions
export const BUILTIN_TEMPLATES: Omit<SummaryTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Standard Session Summary',
    description: 'A comprehensive summary of a gaming session',
    type: 'session',
    template: `# Session {{sessionNumber}}: {{adventureTitle}}

**Date:** {{sessionDate}}
**Duration:** {{duration}}
**Status:** {{completionStatus}}

## Scenes Visited
{{#each scenesVisited}}
- {{this}}
{{/each}}

## NPCs Encountered
{{#each npcsEncountered}}
- {{this}}
{{/each}}

## Key Decisions
{{#each playerDecisions}}
- {{this}}
{{/each}}

{{#if loreUpdates}}
## Lore Updates
{{#each loreUpdates}}
- {{this}}
{{/each}}
{{/if}}

{{#if gmNotes}}
## GM Notes
{{gmNotes}}
{{/if}}

{{#if nextSteps}}
## Next Steps
{{#each nextSteps}}
- {{this}}
{{/each}}
{{/if}}`,
    variables: [
      { name: 'sessionNumber', type: 'number', description: 'Session number', required: true },
      { name: 'adventureTitle', type: 'text', description: 'Adventure title', required: true },
      { name: 'sessionDate', type: 'date', description: 'Session date', required: true },
      { name: 'duration', type: 'text', description: 'Session duration', required: true },
      { name: 'completionStatus', type: 'text', description: 'Session completion status', required: true },
      { name: 'scenesVisited', type: 'list', description: 'List of scenes visited', required: true },
      { name: 'npcsEncountered', type: 'list', description: 'List of NPCs encountered', required: true },
      { name: 'playerDecisions', type: 'list', description: 'Key player decisions', required: false },
      { name: 'loreUpdates', type: 'list', description: 'Lore updates from session', required: false },
      { name: 'gmNotes', type: 'text', description: 'GM private notes', required: false },
      { name: 'nextSteps', type: 'list', description: 'Next steps for next session', required: false }
    ]
  },
  {
    name: 'Adventure Completion Summary',
    description: 'Summary for when an adventure is completed',
    type: 'adventure_completion',
    template: `# Adventure Complete: {{adventureTitle}}

**Completed:** {{sessionDate}}
**Total Sessions:** {{sessionNumber}}
**Duration:** {{duration}}

## Adventure Overview
{{adventureTitle}} has been successfully completed!

## Key Achievements
{{#each achievements}}
- {{this}}
{{/each}}

## Major Plot Points
{{#each playerDecisions}}
- {{this}}
{{/each}}

## Characters Involved
{{#each npcsEncountered}}
- {{this}}
{{/each}}

## Locations Explored
{{#each scenesVisited}}
- {{this}}
{{/each}}

## Lore Impact
{{#each loreUpdates}}
- {{this}}
{{/each}}

## GM Reflections
{{gmNotes}}

## Campaign Impact
{{nextSteps}}`,
    variables: [
      { name: 'adventureTitle', type: 'text', description: 'Adventure title', required: true },
      { name: 'sessionDate', type: 'date', description: 'Completion date', required: true },
      { name: 'sessionNumber', type: 'number', description: 'Total sessions', required: true },
      { name: 'duration', type: 'text', description: 'Total adventure duration', required: true },
      { name: 'achievements', type: 'list', description: 'Key achievements', required: true },
      { name: 'playerDecisions', type: 'list', description: 'Major plot decisions', required: true },
      { name: 'npcsEncountered', type: 'list', description: 'Characters involved', required: true },
      { name: 'scenesVisited', type: 'list', description: 'Locations explored', required: true },
      { name: 'loreUpdates', type: 'list', description: 'Lore impact', required: false },
      { name: 'gmNotes', type: 'text', description: 'GM reflections', required: false },
      { name: 'nextSteps', type: 'text', description: 'Campaign impact', required: false }
    ]
  },
  {
    name: 'Character Development Summary',
    description: 'Focus on character growth and development',
    type: 'character_development',
    template: `# Character Development: {{adventureTitle}}

**Session:** {{sessionNumber}} on {{sessionDate}}
**Focus:** Character growth and relationships

## Character Moments
{{#each playerDecisions}}
- {{this}}
{{/each}}

## Relationship Development
{{#each npcsEncountered}}
- {{this}}
{{/each}}

## Personal Growth
{{#each achievements}}
- {{this}}
{{/each}}

## Character Notes
{{gmNotes}}

## Future Development
{{#each nextSteps}}
- {{this}}
{{/each}}`,
    variables: [
      { name: 'adventureTitle', type: 'text', description: 'Adventure title', required: true },
      { name: 'sessionNumber', type: 'number', description: 'Session number', required: true },
      { name: 'sessionDate', type: 'date', description: 'Session date', required: true },
      { name: 'playerDecisions', type: 'list', description: 'Character moments', required: true },
      { name: 'npcsEncountered', type: 'list', description: 'Relationship development', required: true },
      { name: 'achievements', type: 'list', description: 'Personal growth', required: true },
      { name: 'gmNotes', type: 'text', description: 'Character notes', required: false },
      { name: 'nextSteps', type: 'list', description: 'Future development', required: false }
    ]
  }
];

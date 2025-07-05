import { z } from 'zod';

const task = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  column: z.string(),
  labels: z.array(z.string()).optional(),
  priority: z.number().optional(),
  storyPoints: z.number().optional(),
  sprint: z.string().optional(),
  dates: z.object({
    created: z.string(),
    updated: z.string(),
    moved: z.string().optional(),
  }),
});

const sprint = z.object({
  name: z.string(),
  description: z.string().optional(),
  capacity: z.number().optional(),
  dates: z.object({
    created: z.string(),
    starts: z.string().optional(),
    ends: z.string().optional(),
  }),
});

const column = z.object({
  name: z.string(),
});

const label = z.object({
  name: z.string(),
  color: z.string().optional(),
});

const board = z.object({
  name: z.string(),
  description: z.string().optional(),
  columns: z.array(column),
  tasks: z.record(z.string(), task),
  labels: z.array(label).optional(),
  sprints: z.array(sprint).optional(),
  metadata: z.object({
    nextId: z.number(),
    version: z.string(),
  }),
  dates: z.object({
    created: z.string(),
    updated: z.string(),
    saved: z.string(),
  }),
});

export const zknbn = {
  task,
  sprint,
  column,
  label,
  board,
}
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { createTask } from 'knbn/actions/task';
import { pcwd } from 'knbn/utils/files';
import { Brands } from 'knbn/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerCreateTaskTool = (server: McpServer) =>
  registerStructuredTool(server, 'create_task',
    {
      title: 'Create KnBn Task',
      description: 'Create a new task in a KnBn board',
      inputSchema: {
        title: z.string().describe('Task title'),
        description: z.string().optional().describe('Task description'),
        column: z.string().optional().describe('Column to place the task in (defaults to first column)'),
        labels: z.array(z.string()).optional().describe('Task labels'),
        priority: z.number().optional().describe('Task priority'),
        storyPoints: z.number().optional().describe('Story points for the task'),
        sprint: z.string().optional().describe('Sprint assignment'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        task: z.object({
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
        }),
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        const { task } = createTask(filepath, {
          title: args.title,
          description: args.description,
          column: args.column,
          labels: args.labels,
          priority: args.priority,
          storyPoints: args.storyPoints,
          sprint: args.sprint,
        });

        return {
          structuredContent: {
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              column: task.column,
              labels: task.labels,
              priority: task.priority,
              storyPoints: task.storyPoints,
              sprint: task.sprint,
              dates: task.dates,
            },
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error creating task'
          }],
        };
      }
    }
  );
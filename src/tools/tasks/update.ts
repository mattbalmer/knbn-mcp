import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { updateTask } from 'knbn/actions/task';
import { pcwd } from 'knbn/utils/files';
import { Brands } from 'knbn/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerUpdateTaskTool = (server: McpServer) =>
  registerStructuredTool(server, 'update_task',
    {
      title: 'Update KnBn Task',
      description: 'Update an existing task in a KnBn board',
      inputSchema: {
        id: z.number().describe('Task ID to update'),
        title: z.string().optional().describe('New task title'),
        description: z.string().optional().describe('New task description'),
        column: z.string().optional().describe('New column for the task'),
        labels: z.array(z.string()).optional().describe('New task labels'),
        priority: z.number().optional().describe('New task priority'),
        storyPoints: z.number().optional().describe('New story points for the task'),
        sprint: z.string().optional().describe('New sprint assignment'),
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

        const updates: any = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.column !== undefined) updates.column = args.column;
        if (args.labels !== undefined) updates.labels = args.labels;
        if (args.priority !== undefined) updates.priority = args.priority;
        if (args.storyPoints !== undefined) updates.storyPoints = args.storyPoints;
        if (args.sprint !== undefined) updates.sprint = args.sprint;

        if (Object.keys(updates).length === 0) {
          return {
            isError: true,
            contents: [{
              type: 'text',
              text: 'No updates specified. Provide at least one field to update.'
            }],
          };
        }

        const board = updateTask(filepath, args.id, updates);
        const task = board.tasks[args.id];
        
        if (!task) {
          return {
            isError: true,
            contents: [{
              type: 'text',
              text: `Task #${args.id} not found`
            }],
          };
        }

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
            text: error?.message || error || 'Unknown error updating task'
          }],
        };
      }
    }
  );
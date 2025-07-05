import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { updateTasksBatch } from 'knbn/actions/task';
import { pcwd } from 'knbn/utils/files';
import { Brands } from 'knbn/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerUpdateTasksBatchTool = (server: McpServer) =>
  registerStructuredTool(server, 'update_tasks_batch',
    {
      title: 'Update Multiple KnBn Tasks',
      description: 'Update multiple tasks at once in a KnBn board',
      inputSchema: {
        updates: z.record(z.number(), z.object({
          title: z.string().optional().describe('New task title'),
          description: z.string().optional().describe('New task description'),
          column: z.string().optional().describe('New column for the task'),
          labels: z.array(z.string()).optional().describe('New task labels'),
          priority: z.number().optional().describe('New task priority'),
          storyPoints: z.number().optional().describe('New story points for the task'),
          sprint: z.string().optional().describe('New sprint assignment'),
        })).describe('Record of task ID to task updates mapping'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        updatedCount: z.number(),
        tasks: z.record(z.number(), z.object({
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
        })),
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        if (!args.updates || Object.keys(args.updates).length === 0) {
          return {
            isError: true,
            contents: [{
              type: 'text',
              text: 'No task updates specified. Provide a record of task updates.'
            }],
          };
        }

        const {
          tasks: updatedTasks
        } = updateTasksBatch(filepath, args.updates);

        return {
          structuredContent: {
            updatedCount: Object.keys(args.updates).length,
            tasks: updatedTasks,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error updating tasks'
          }],
        };
      }
    }
  );
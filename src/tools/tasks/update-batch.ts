import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { updateTasksBatch } from 'knbn-core/actions/task';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';
import { zknbn } from '../../zod/output';
import { Task } from 'knbn-core/types/knbn';

export const registerUpdateTasksBatchTool = (server: McpServer) =>
  registerStructuredTool(server, 'update_tasks_batch',
    {
      title: 'Update Multiple KnBn Tasks',
      description: 'Update multiple tasks at once in a KnBn board',
      inputSchema: {
        updates: z.record(z.string(), z.object({
          title: z.string().optional().describe('New task title'),
          description: z.string().nullish().describe('New task description'),
          column: z.string().nullish().describe('New column for the task'),
          labels: z.array(z.string()).optional().describe('New task labels'),
          priority: z.number().nullish().describe('New task priority'),
          storyPoints: z.number().nullish().describe('New story points for the task'),
          sprint: z.string().nullish().describe('New sprint assignment'),
        })).describe('Record of task ID to task updates mapping'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        updatedCount: z.number(),
        tasks: z.record(z.string(), zknbn.task),
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

        const updates = Object.entries(args.updates).reduce((acc, [id, update]) => {
          const updateData: Partial<Task> = Object.entries(update).reduce((updAcc, [key, value]) => {
            if (value !== undefined) {
              // @ts-ignore
              updAcc[key] = value ?? undefined;
            }
            return updAcc;
          }, {} as Partial<Task>);
          return {
            ...acc,
            [parseInt(id, 10)]: updateData
          }
        }, {} as Record<number, Partial<Task>>);

        const {
          tasks: updatedTasks
        } = updateTasksBatch(filepath, updates);

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
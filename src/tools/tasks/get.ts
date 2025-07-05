import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { loadBoard } from 'knbn/utils/board-files';
import { pcwd } from 'knbn/utils/files';
import { Brands } from 'knbn/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerGetTaskTool = (server: McpServer) =>
  registerStructuredTool(server, 'get_task',
    {
      title: 'Get KnBn Task',
      description: 'Get a specific task by ID from a KnBn board',
      inputSchema: {
        id: z.number().describe('Task ID'),
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
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        const board = loadBoard(filepath);
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
            text: error?.message || error || 'Unknown error getting task'
          }],
        };
      }
    }
  );
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { loadBoard } from 'knbn/utils/board-files';
import { pcwd } from 'knbn/utils/files';
import { Brands } from 'knbn/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerListTasksTool = (server: McpServer) =>
  registerStructuredTool(server, 'list_tasks',
    {
      title: 'List KnBn Tasks',
      description: 'List all tasks in a KnBn board with optional filtering',
      inputSchema: {
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
        column: z.string().optional().describe('Filter tasks by column'),
        label: z.string().optional().describe('Filter tasks by label'),
        sprint: z.string().optional().describe('Filter tasks by sprint'),
        priority: z.number().optional().describe('Filter tasks by priority'),
      },
      outputSchema: {
        tasks: z.array(z.object({
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
        totalCount: z.number(),
        filteredCount: z.number(),
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
        let tasks = Object.values(board.tasks);
        const totalCount = tasks.length;

        // Apply filters
        if (args.column) {
          tasks = tasks.filter(task => task.column === args.column);
        }

        if (args.label) {
          tasks = tasks.filter(task => task.labels?.includes(args.label!));
        }

        if (args.sprint) {
          tasks = tasks.filter(task => task.sprint === args.sprint);
        }

        if (args.priority !== undefined) {
          tasks = tasks.filter(task => task.priority === args.priority);
        }

        const filteredCount = tasks.length;

        return {
          structuredContent: {
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              column: task.column,
              labels: task.labels,
              priority: task.priority,
              storyPoints: task.storyPoints,
              sprint: task.sprint,
              dates: task.dates,
            })),
            totalCount,
            filteredCount,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error listing tasks'
          }],
        };
      }
    }
  );
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { loadBoard } from 'knbn-core/utils/board-files';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';
import { zknbn } from '../../zod/output';
import { findTasks } from 'knbn-core/actions/task';

export const registerListTasksTool = (server: McpServer) =>
  registerStructuredTool(server, 'list_tasks',
    {
      title: 'List KnBn Tasks',
      description: 'List all tasks in a KnBn board with optional filtering',
      inputSchema: {
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
        q: z.string().optional().describe('String to search task title and description for'),
        column: z.string().optional().describe('Filter tasks by column'),
        label: z.string().optional().describe('Filter tasks by label'),
        sprint: z.string().optional().describe('Filter tasks by label'),
        priority: z.number().optional().describe('Filter tasks by priority'),
      },
      outputSchema: {
        tasks: z.array(zknbn.task),
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

        let tasks = args.q ? findTasks(filepath, args.q): Object.values(loadBoard(filepath).tasks);
        const totalCount = tasks.length;

        // Apply filters
        if (args.hasOwnProperty('column')) {
          tasks = tasks.filter(task => task.column === args.column);
        }

        if (args.hasOwnProperty('sprint')) {
          tasks = tasks.filter(task => task.sprint === args.sprint);
        }

        if (args.hasOwnProperty('label')) {
          tasks = tasks.filter(task => task.labels?.some(l => l === args.label));
        }

        if (args.hasOwnProperty('priority')) {
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
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error listing tasks'
          }],
        };
      }
    }
  );
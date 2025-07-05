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
        q: z.string().optional().describe('String to search tasks for'),
        qFields: z.array(z.string()).optional().describe('Fields to apply the query to. Defaults to all searchable fields. Accepts: title, description, sprint, labels'),
        column: z.string().optional().describe('Filter tasks by column'),
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

        let tasks = findTasks(filepath, args.q ?? '', args.qFields)
        const totalCount = tasks.length;

        // Apply filters
        if (args.column) {
          tasks = tasks.filter(task => task.column === args.column);
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
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error listing tasks'
          }],
        };
      }
    }
  );
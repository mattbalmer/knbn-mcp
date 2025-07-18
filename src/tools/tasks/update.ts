import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { updateTask } from 'knbn-core/actions/task';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';
import { zknbn } from '../../zod/output';

export const registerUpdateTaskTool = (server: McpServer) =>
  registerStructuredTool(server, 'update_task',
    {
      title: 'Update KnBn Task',
      description: 'Update an existing task in a KnBn board',
      inputSchema: {
        id: z.number().describe('Task ID to update'),
        title: z.string().optional().describe('New task title'),
        description: z.string().nullish().describe('New task description'),
        column: z.string().nullish().describe('New column for the task'),
        labels: z.array(z.string()).optional().describe('New task labels'),
        priority: z.number().nullish().describe('New task priority'),
        storyPoints: z.number().nullish().describe('New story points for the task'),
        sprint: z.string().nullish().describe('New sprint assignment'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        task: zknbn.task,
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        const updates: any = {};
        if (args.hasOwnProperty('title')) updates.title = args.title;
        if (args.hasOwnProperty('description')) updates.description = args.description;
        if (args.hasOwnProperty('column')) updates.column = args.column;
        if (args.hasOwnProperty('labels')) updates.labels = args.labels;
        if (args.hasOwnProperty('priority')) updates.priority = args.priority;
        if (args.hasOwnProperty('storyPoints')) updates.storyPoints = args.storyPoints;
        if (args.hasOwnProperty('sprint')) updates.sprint = args.sprint;

        if (Object.keys(updates).length === 0) {
          return {
            isError: true,
            content: [{
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
            content: [{
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
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error updating task'
          }],
        };
      }
    }
  );
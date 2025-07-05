import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { z } from 'zod';
import { Brands } from 'knbn/utils/ts';
import { loadBoard } from 'knbn/utils/board-files';
import path from 'path';
import { pcwd } from 'knbn/utils/files';

export const registerGetBoardTool = (server: McpServer) =>
  registerStructuredTool(server, 'get_board',
    {
      title: 'Get KnBn Board',
      description: 'Get the full contents of a KnBn board file',
      inputSchema: {
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        board: z.object({
          name: z.string(),
          description: z.string().optional(),
          columns: z.array(z.object({
            name: z.string(),
          })),
          tasks: z.record(z.object({
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
          labels: z.array(z.object({
            name: z.string(),
            color: z.string().optional(),
          })).optional(),
          sprints: z.array(z.object({
            name: z.string(),
            description: z.string().optional(),
            capacity: z.number().optional(),
            dates: z.object({
              created: z.string(),
              starts: z.string().optional(),
              ends: z.string().optional(),
            }),
          })).optional(),
          metadata: z.object({
            nextId: z.number(),
            version: z.string(),
          }),
          dates: z.object({
            created: z.string(),
            updated: z.string(),
            saved: z.string(),
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

        return {
          structuredContent: {
            board: {
              name: board.name,
              description: board.description,
              columns: board.columns,
              tasks: board.tasks,
              labels: board.labels,
              sprints: board.sprints,
              metadata: board.metadata,
              dates: board.dates,
            },
          },
        };
      } catch (error: any) {
        throw new Error(error?.message || error || 'Unknown error loading board');
      }
    }
  );
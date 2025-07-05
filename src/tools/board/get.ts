import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { z } from 'zod';
import { Brands } from 'knbn-core/utils/ts';
import { loadBoard } from 'knbn-core/utils/board-files';
import path from 'path';
import { pcwd } from 'knbn-core/utils/files';
import { zknbn } from '../../zod/output';

export const registerGetBoardTool = (server: McpServer) =>
  registerStructuredTool(server, 'get_board',
    {
      title: 'Get KnBn Board',
      description: 'Get the full contents of a KnBn board file',
      inputSchema: {
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        board: zknbn.board,
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
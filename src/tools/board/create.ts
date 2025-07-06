import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import path from 'path';
import { getFilenameFromBoardName, getFilepathForBoardFile, pcwd } from 'knbn-core/utils/files';
import { createBoard } from 'knbn-core/actions/board';
import { z } from 'zod';
import { zknbn } from '../../zod/output';

export const registerCreateBoardTool = (server: McpServer) =>
  registerStructuredTool(server, 'create_board',
    {
      title: 'Create KnBn Board',
      description: 'Create a new .knbn board file',
      inputSchema: {
        name: z.string().describe('Board name'),
        description: z.string().optional().nullish().describe('Board description'),
        filename: z.string().optional().describe('Custom filename (defaults to .knbn)'),
      },
      outputSchema: {
        filename: z.string(),
        board: zknbn.board,
      },
    },
    async (args) => {
      try {
        const filepath = getFilepathForBoardFile(getFilenameFromBoardName(args.name));
        const board = createBoard(filepath, {
          name: args.name,
          description: args.description ?? undefined,
        });
        const filename = path.basename(filepath);

        return {
          structuredContent: {
            filename,
            board,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error creating board: ${error.message || error || 'Unknown error creating board'}`,
          }]
        }
      }
    }
  );

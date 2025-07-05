import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { removeColumn } from 'knbn-core/actions/column';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerRemoveColumnTool = (server: McpServer) =>
  registerStructuredTool(server, 'remove_column',
    {
      title: 'Remove KnBn Column',
      description: 'Remove a column from a KnBn board',
      inputSchema: {
        name: z.string().describe('Column name to remove'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        columns: z.array(z.object({
          name: z.string(),
        })),
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        const board = removeColumn(filepath, args.name);

        return {
          structuredContent: {
            columns: board.columns,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error removing column'
          }],
        };
      }
    }
  );
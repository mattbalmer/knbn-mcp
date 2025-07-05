import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { createColumn } from 'knbn-core/actions/column';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerCreateColumnTool = (server: McpServer) =>
  registerStructuredTool(server, 'create_column',
    {
      title: 'Create KnBn Column',
      description: 'Create a new column in a KnBn board',
      inputSchema: {
        name: z.string().describe('Column name'),
        position: z.number().optional().describe('Position to insert the column (0-based index)'),
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

        const board = createColumn(filepath, { name: args.name }, args.position);

        return {
          structuredContent: {
            columns: board.columns,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error creating column'
          }],
        };
      }
    }
  );
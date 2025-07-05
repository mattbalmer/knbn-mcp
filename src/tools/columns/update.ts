import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { updateColumn } from 'knbn-core/actions/column';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerUpdateColumnTool = (server: McpServer) =>
  registerStructuredTool(server, 'update_column',
    {
      title: 'Update KnBn Column',
      description: 'Update an existing column in a KnBn board',
      inputSchema: {
        currentName: z.string().describe('Current column name'),
        newName: z.string().optional().describe('New column name'),
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

        const updates: any = {};
        if (args.newName) updates.name = args.newName;

        const board = updateColumn(filepath, args.currentName, updates);

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
            text: error?.message || error || 'Unknown error updating column'
          }],
        };
      }
    }
  );
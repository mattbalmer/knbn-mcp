import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { removeSprint } from 'knbn-core/actions/sprint';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerRemoveSprintTool = (server: McpServer) =>
  registerStructuredTool(server, 'remove_sprint',
    {
      title: 'Remove KnBn Sprint',
      description: 'Remove a sprint from a KnBn board',
      inputSchema: {
        name: z.string().describe('Sprint name to remove'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        removed: z.boolean(),
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        removeSprint(filepath, args.name);

        return {
          structuredContent: {
            removed: true,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error removing sprint'
          }],
        };
      }
    }
  );
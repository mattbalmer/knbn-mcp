import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { removeLabel } from 'knbn-core/actions/label';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerRemoveLabelTool = (server: McpServer) =>
  registerStructuredTool(server, 'remove_label',
    {
      title: 'Remove KnBn Label',
      description: 'Remove a label from a KnBn board',
      inputSchema: {
        name: z.string().describe('Label name to remove'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        labels: z.array(z.object({
          name: z.string(),
          color: z.string().optional(),
        })),
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        const board = removeLabel(filepath, args.name);

        return {
          structuredContent: {
            labels: board.labels || [],
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error removing label'
          }],
        };
      }
    }
  );
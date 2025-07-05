import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { addLabel, getLabel } from 'knbn-core/actions/label';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerAddLabelTool = (server: McpServer) =>
  registerStructuredTool(server, 'add_label',
    {
      title: 'Add KnBn Label',
      description: 'Add a new label to a KnBn board',
      inputSchema: {
        name: z.string().describe('Label name'),
        color: z.string().optional().describe('Label color'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        label: z.object({
          name: z.string(),
          color: z.string().optional(),
        }).optional(),
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

        const board = addLabel(filepath, { 
          name: args.name, 
          color: args.color 
        });

        const addedLabel = getLabel(filepath, args.name);

        return {
          structuredContent: {
            label: addedLabel,
            labels: board.labels || [],
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error adding label'
          }],
        };
      }
    }
  );
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { updateLabel, getLabel } from 'knbn/actions/label';
import { pcwd } from 'knbn/utils/files';
import { Brands } from 'knbn/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerUpdateLabelTool = (server: McpServer) =>
  registerStructuredTool(server, 'update_label',
    {
      title: 'Update KnBn Label',
      description: 'Update an existing label in a KnBn board',
      inputSchema: {
        currentName: z.string().describe('Current label name'),
        newName: z.string().optional().describe('New label name'),
        color: z.string().optional().describe('New label color'),
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

        const updates: any = {};
        if (args.newName) updates.name = args.newName;
        if (args.color !== undefined) updates.color = args.color;

        const board = updateLabel(filepath, args.currentName, updates);
        const updatedLabel = getLabel(filepath, args.newName || args.currentName);

        return {
          structuredContent: {
            label: updatedLabel,
            labels: board.labels || [],
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error updating label'
          }],
        };
      }
    }
  );
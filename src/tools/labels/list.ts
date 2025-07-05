import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { listLabels } from 'knbn-core/actions/label';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerListLabelsTool = (server: McpServer) =>
  registerStructuredTool(server, 'list_labels',
    {
      title: 'List KnBn Labels',
      description: 'List all labels in a KnBn board',
      inputSchema: {
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        labels: z.array(z.object({
          name: z.string(),
          color: z.string().optional(),
        })),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        const labels = listLabels(filepath);

        return {
          structuredContent: {
            labels,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error listing labels'
          }],
        };
      }
    }
  );
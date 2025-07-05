import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { listSprints, getActiveSprints, getUpcomingSprints, getCompletedSprints } from 'knbn-core/actions/sprint';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerListSprintsTool = (server: McpServer) =>
  registerStructuredTool(server, 'list_sprints',
    {
      title: 'List KnBn Sprints',
      description: 'List all sprints in a KnBn board with optional filtering',
      inputSchema: {
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
        filter: z.enum(['all', 'active', 'upcoming', 'completed']).optional().default('all').describe('Filter sprints by status'),
      },
      outputSchema: {
        sprints: z.array(z.object({
          name: z.string(),
          description: z.string().optional(),
          capacity: z.number().optional(),
          dates: z.object({
            created: z.string(),
            starts: z.string().optional(),
            ends: z.string().optional(),
          }),
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

        let sprints;
        switch (args.filter) {
          case 'active':
            sprints = getActiveSprints(filepath);
            break;
          case 'upcoming':
            sprints = getUpcomingSprints(filepath);
            break;
          case 'completed':
            sprints = getCompletedSprints(filepath);
            break;
          default:
            sprints = listSprints(filepath);
        }

        return {
          structuredContent: {
            sprints,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error listing sprints'
          }],
        };
      }
    }
  );
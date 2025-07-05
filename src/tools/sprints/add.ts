import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { addSprint } from 'knbn-core/actions/sprint';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerAddSprintTool = (server: McpServer) =>
  registerStructuredTool(server, 'add_sprint',
    {
      title: 'Add KnBn Sprint',
      description: 'Add a new sprint to a KnBn board',
      inputSchema: {
        name: z.string().describe('Sprint name'),
        description: z.string().optional().describe('Sprint description'),
        capacity: z.number().optional().describe('Sprint capacity'),
        starts: z.string().optional().describe('Sprint start date (ISO string)'),
        ends: z.string().optional().describe('Sprint end date (ISO string)'),
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
      },
      outputSchema: {
        sprint: z.object({
          name: z.string(),
          description: z.string().optional(),
          capacity: z.number().optional(),
          dates: z.object({
            created: z.string(),
            starts: z.string().optional(),
            ends: z.string().optional(),
          }),
        }),
      },
    },
    async (args) => {
      try {
        const filename = args.filename || '.knbn';
        const filepath = Brands.Filepath(path.join(pcwd(), filename));

        const sprintData: any = {
          name: args.name,
          description: args.description,
          capacity: args.capacity,
        };
        
        if (args.starts || args.ends) {
          sprintData.dates = {};
          if (args.starts) sprintData.dates.starts = args.starts;
          if (args.ends) sprintData.dates.ends = args.ends;
        }

        const sprint = addSprint(filepath, sprintData);

        return {
          structuredContent: {
            sprint,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: error?.message || error || 'Unknown error adding sprint'
          }],
        };
      }
    }
  );
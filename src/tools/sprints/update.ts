import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { updateSprint } from 'knbn/actions/sprint';
import { pcwd } from 'knbn/utils/files';
import { Brands } from 'knbn/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerUpdateSprintTool = (server: McpServer) =>
  registerStructuredTool(server, 'update_sprint',
    {
      title: 'Update KnBn Sprint',
      description: 'Update an existing sprint in a KnBn board',
      inputSchema: {
        currentName: z.string().describe('Current sprint name'),
        newName: z.string().optional().describe('New sprint name'),
        description: z.string().optional().describe('New sprint description'),
        capacity: z.number().optional().describe('New sprint capacity'),
        starts: z.string().optional().describe('New sprint start date (ISO string)'),
        ends: z.string().optional().describe('New sprint end date (ISO string)'),
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

        const updates: any = {};
        if (args.newName) updates.name = args.newName;
        if (args.description !== undefined) updates.description = args.description;
        if (args.capacity !== undefined) updates.capacity = args.capacity;
        if (args.starts !== undefined) {
          updates.dates = { starts: args.starts };
        }
        if (args.ends !== undefined) {
          updates.dates = { ...updates.dates, ends: args.ends };
        }

        const sprint = updateSprint(filepath, args.currentName, updates);

        return {
          structuredContent: {
            sprint,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error updating sprint'
          }],
        };
      }
    }
  );
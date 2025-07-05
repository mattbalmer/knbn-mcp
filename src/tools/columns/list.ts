import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { listColumns, getTasksInColumn } from 'knbn-core/actions/column';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import { z } from 'zod';
import * as path from 'path';

export const registerListColumnsTool = (server: McpServer) =>
  registerStructuredTool(server, 'list_columns',
    {
      title: 'List KnBn Columns',
      description: 'List all columns in a KnBn board',
      inputSchema: {
        filename: z.string().optional().describe('Board filename (defaults to .knbn)'),
        includeTasks: z.boolean().optional().describe('Include task counts for each column'),
      },
      outputSchema: {
        columns: z.array(z.object({
          name: z.string(),
          taskCount: z.number().optional(),
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

        const columns = listColumns(filepath);
        
        const columnsWithTasks = columns.map(column => ({
          name: column.name,
          taskCount: args.includeTasks ? getTasksInColumn(filepath, column.name).length : undefined,
        }));

        return {
          structuredContent: {
            columns: columnsWithTasks,
          },
        };
      } catch (error: any) {
        return {
          isError: true,
          contents: [{
            type: 'text',
            text: error?.message || error || 'Unknown error listing columns'
          }],
        };
      }
    }
  );
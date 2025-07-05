import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStructuredTool } from '../../patch';
import { pcwd } from 'knbn/utils/files';
import { findBoardFiles } from 'knbn/actions/board';
import { loadBoardFields } from 'knbn/utils/board-files';
import { z } from 'zod';

export const registerListBoardsTool = (server: McpServer) =>
  registerStructuredTool(server, 'list_boards',
    {
      title: 'List KnBn Boards',
      description: 'List all .knbn board files in the current directory',
      outputSchema: {
        boards: z.object({
          filename: z.string(),
          boardName: z.string(),
        }).array(),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => {
      // call core/boardUtils to list board files
      const files = findBoardFiles(pcwd());
      const boardsLimited = files.map(file => {
        let boardName;
        try {
          const board = loadBoardFields(file, ['name']);
          boardName = board.name || ' -- No Name -- ';
        } catch (e) {
          boardName = ' -- Error loading board -- ';
        }
        return {
          filename: file,
          boardName,
        };
      });
      return {
        structuredContent: {
          boards: boardsLimited,
        },
      }
    }
  );


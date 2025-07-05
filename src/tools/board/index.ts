import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerListBoardsTool } from './list';
import { registerGetBoardTool } from './get';
import { registerCreateBoardTool } from './create';
import { registerMigrateTool } from './migrate';

export const registerBoardTools = (server: McpServer) => {
  registerListBoardsTool(server);
  registerGetBoardTool(server);
  registerCreateBoardTool(server);
  registerMigrateTool(server);
};
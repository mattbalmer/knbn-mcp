import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCreateColumnTool } from './create';
import { registerUpdateColumnTool } from './update';
import { registerRemoveColumnTool } from './remove';
import { registerListColumnsTool } from './list';

export const registerColumnTools = (server: McpServer) => {
  registerCreateColumnTool(server);
  registerUpdateColumnTool(server);
  registerRemoveColumnTool(server);
  registerListColumnsTool(server);
};
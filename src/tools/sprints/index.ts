import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAddSprintTool } from './add';
import { registerUpdateSprintTool } from './update';
import { registerRemoveSprintTool } from './remove';
import { registerListSprintsTool } from './list';

export const registerSprintTools = (server: McpServer) => {
  registerAddSprintTool(server);
  registerUpdateSprintTool(server);
  registerRemoveSprintTool(server);
  registerListSprintsTool(server);
};
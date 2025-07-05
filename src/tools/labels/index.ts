import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAddLabelTool } from './add';
import { registerUpdateLabelTool } from './update';
import { registerRemoveLabelTool } from './remove';
import { registerListLabelsTool } from './list';

export const registerLabelTools = (server: McpServer) => {
  registerAddLabelTool(server);
  registerUpdateLabelTool(server);
  registerRemoveLabelTool(server);
  registerListLabelsTool(server);
};
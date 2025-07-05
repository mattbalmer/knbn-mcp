#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { KNBN_CORE_VERSION } from 'knbn/constants/index';

// Import all tool registrations
import { registerBoardTools } from './tools/board';
import { registerTaskTools } from './tools/tasks';
import { registerColumnTools } from './tools/columns';
import { registerLabelTools } from './tools/labels';
import { registerSprintTools } from './tools/sprints';

// Import resource registrations
import { registerBoardResources } from './resources/board-resource';

const MCP_SERVER_VERSION = KNBN_CORE_VERSION;

// Create an MCP server
const server = new McpServer({
  name: 'knbn-mcp-server',
  version: MCP_SERVER_VERSION,
});

// Register all tools
registerBoardTools(server);
registerTaskTools(server);
registerColumnTools(server);
registerLabelTools(server);
registerSprintTools(server);

// Register all resources
registerBoardResources(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("KnBn MCP server is running...");
}

main().catch((error) => {
  console.error("KnBn Server error:", error);
  process.exit(1);
});
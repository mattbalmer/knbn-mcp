# KnBn MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with structured access to kanban board functionality. Built on top of the [KnBn CLI tool](https://github.com/mattbalmer/knbn), this server exposes kanban operations through MCP tools and resources.

## Overview

KnBn MCP Server enables AI assistants to interact with kanban boards programmatically using the standardized MCP protocol. It provides three main interaction methods:

- **MCP Tools**: Interactive operations for creating, updating, and managing boards, tasks, columns, labels, and sprints
- **MCP Resources**: Read-only access to board data with structured URI patterns
- **CLI Integration**: Built on the proven KnBn CLI for reliable board operations

## Features

- **Board Management**: Create, list, and migrate kanban boards
- **Task Operations**: Full CRUD operations including batch updates
- **Column Management**: Create, update, remove, and list board columns
- **Label System**: Add, update, remove, and list task labels with colors
- **Sprint Management**: Create and manage development sprints
- **Resource Access**: Read-only data access via MCP resources
- **Migration Support**: Upgrade board files to latest format versions

## Installation

### As MCP Server

1. Install the package:
```bash
npm install knbn-mcp
```

2. Configure in your MCP client (e.g., Claude Desktop):
```json
{
  "mcpServers": {
    "knbn": {
      "command": "npx",
      "args": ["knbn-mcp"]
    }
  }
}
```

### For Development

1. Clone the repository:
```bash
git clone https://github.com/mattbalmer/knbn-mcp.git
cd knbn-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Usage

### MCP Tools

The server provides organized tool categories:

#### Board Tools
- `list_boards` - List all .knbn board files
- `get_board` - Get complete board contents
- `create_board` - Create new board with name and description
- `migrate` - Migrate board files to latest version

#### Task Tools
- `create_task` - Create task with title, description, priority, story points
- `get_task` - Get task details by ID
- `list_tasks` - List/filter tasks by column, label, priority, sprint
- `update_task` - Update task properties
- `update_tasks_batch` - Update multiple tasks efficiently

#### Column Tools
- `create_column` - Add new column at specified position
- `list_columns` - List all columns with optional task counts
- `update_column` - Rename existing column
- `remove_column` - Delete column

#### Label Tools
- `add_label` - Create label with name and color
- `list_labels` - List all available labels
- `update_label` - Modify label name or color
- `remove_label` - Delete label from board

#### Sprint Tools
- `add_sprint` - Create sprint with dates, capacity, description
- `list_sprints` - List sprints filtered by status
- `update_sprint` - Modify sprint properties
- `remove_sprint` - Delete sprint

### MCP Resources

Access board data through structured URIs:

- `knbn://boards` - List of all board files
- `knbn://board/{filename}` - Complete board data
- `knbn://board/{filename}/summary` - Board summary with metrics
- `knbn://board/{filename}/tasks` - All tasks from a board

### Example Usage

```typescript
// Create a new board
await mcpClient.callTool("create_board", {
  name: "Project Alpha",
  description: "Development board for Project Alpha",
  filename: "alpha.knbn"
});

// Create a task
await mcpClient.callTool("create_task", {
  title: "Implement authentication",
  description: "Add login and registration functionality",
  column: "To Do",
  priority: 1,
  storyPoints: 5,
  labels: ["backend", "security"],
  filename: "alpha.knbn"
});

// Move task to different column
await mcpClient.callTool("update_task", {
  id: 1,
  column: "In Progress",
  filename: "alpha.knbn"
});

// Get board summary
const summary = await mcpClient.readResource("knbn://board/alpha.knbn/summary");
```

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Architecture

```
src/
├── server.ts           # Main MCP server entry point
├── patch.ts            # MCP SDK extensions
├── tools/              # MCP tools organized by domain
│   ├── board/          # Board management tools
│   ├── tasks/          # Task management tools
│   ├── columns/        # Column management tools
│   ├── labels/         # Label management tools
│   └── sprints/        # Sprint management tools
└── resources/          # MCP resources for data access
    └── board-resource.ts
```

### Testing

Tests are located in `tests/` with fixtures in `tests/fixtures/`. Run the test suite:

```bash
npm test
```

Generate coverage report:

```bash
npm run test:coverage
```

## Board File Format

Board data is stored in `.knbn` files using a structured format. The MCP server handles all file operations automatically, but you can also interact with these files directly using the [KnBn CLI](https://github.com/mattbalmer/knbn).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related Projects

- [KnBn CLI](https://github.com/mattbalmer/knbn) - Command-line kanban tool
- [KnBn Web](https://github.com/mattbalmer/knbn-web) - Web interface for KnBn boards
- [Model Context Protocol](https://modelcontextprotocol.io) - Protocol specification
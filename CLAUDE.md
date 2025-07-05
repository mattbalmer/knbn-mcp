# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnBn MCP is a TypeScript-based Model Context Protocol (MCP) server that provides AI assistants with structured access to kanban board functionality. It's built on top of the `knbn` CLI tool and exposes kanban operations through MCP tools and resources.

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm test` - Run Jest tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:coverage` - Generate test coverage report

## Architecture

### MCP Server Structure
```
src/
├── server.ts           # Main MCP server entry point
├── patch.ts            # MCP SDK extensions and utilities
├── tools/              # MCP tools organized by domain
│   ├── board/          # Board management (create, get, list, migrate)
│   ├── tasks/          # Task management (CRUD + batch operations)
│   ├── columns/        # Column management (create, list, update, remove)
│   ├── labels/         # Label management (add, list, update, remove)
│   └── sprints/        # Sprint management (add, list, update, remove)
└── resources/          # MCP resources for read-only data access
    └── board-resource.ts
```

### Tool Registration Pattern
Each tool category follows a consistent pattern:
- `index.ts` - Registers all tools in the category
- Individual tool files export `registerXXXTool(server)` functions
- Tools are auto-registered in `server.ts`

### Key Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `knbn` - Core kanban functionality (separate npm package)
- `js-yaml` - YAML parsing for board files
- `jest` + `ts-jest` - Testing framework

## MCP Integration

The server exposes kanban functionality through:
- **Tools**: Interactive operations (create, update, delete)
- **Resources**: Read-only data access with URI patterns like `knbn://board/{filename}`

Board data is stored in `.knbn` files in the working directory. The MCP server provides structured access to this data without requiring direct file manipulation.

## Testing

Tests are located in `tests/` directory with fixtures in `tests/fixtures/`. The project uses Jest with TypeScript support. Test coverage reports are generated in the `coverage/` directory.

## Build Process

The project compiles TypeScript to JavaScript using standard `tsc`. The compiled output in `dist/` is what gets executed as the MCP server. The main entry point is `dist/server.js`.
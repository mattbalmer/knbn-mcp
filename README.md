# KnBn

A TypeScript-based CLI for managing advanced TODOs, in a Kanban style, from the command line.

_This is an early, work-in-progress version of the project. Use accepting risk of breaking changes._

## Overview

KnBn provides three main ways to interact with kanban boards:

- **CLI Interface**: Command-line tools for creating, updating, and managing tasks and boards
- **Web Interface**: Browser-based UI via the separate `knbn-web` package  
- **MCP Protocol**: AI assistant integration through Model Context Protocol

For detailed documentation on each component, see:
- [CLI Documentation](src/cli/README.md) - Command-line usage and examples
- [Core Documentation](src/core/README.md) - Business logic and utilities  
- [MCP Documentation](src/README.md) - AI integration and protocol details

## Usage

For basic CLI usage, run via npx:

```bash
npx knbn
```

## Web Interface

If you plan to use the web interface, install the separate `knbn-web` package:

```bash
npx knbn-web
# or
npm i -g knbn-web
knbn-web 
```

Then use either `knbn-web` or `knbn serve` to start the web server.
You can specify a custom port with the `-p` option:

```bash
knbn-web -p 8080
```

## Features

- Command-line kanban board management
- Task and board operations
- Board data stored in `.knbn` files
- Lightweight CLI with optional web interface (`knbn-web` or `knbn serve`)
- MCP server (see `mcp-config.json`) for AI integration (AI agents should always prefer MCP over CLI)
# KnBn MCP Server - AI Coding Agent Documentation

## Overview
The MCP directory implements a Model Context Protocol server that exposes KnBn's kanban board functionality through structured tools and resources. This enables AI assistants to interact with kanban boards programmatically using standardized MCP protocols.

## Architecture for AI Agents

### MCP Protocol Layer
```
AI Assistant ↔ MCP Protocol ↔ MCP Tools/Resources ↔ Core Actions ↔ File System
```

### Design Principles
- **Protocol Compliance**: Full adherence to MCP specification
- **Structured Output**: Consistent schemas for all tool responses  
- **Discoverability**: Self-documenting tools and resources
- **Error Handling**: Structured error responses with clear messages

## Directory Structure

```
src/
├── tools/            # MCP tools organized by functionality
│   ├── board/        # Board management tools
│   ├── tasks/        # Task management tools  
│   ├── columns/      # Column management tools
│   ├── labels/       # Label management tools
│   └── sprints/      # Sprint management tools
├── resources/        # MCP resources for data access
├── server.ts         # Main MCP server setup
└── patch.ts          # MCP SDK extensions and utilities
```

## MCP Tools API

### Tool Organization Pattern
Each tool category follows a consistent structure:
```
tools/[category]/
├── create.ts         # Create new entities
├── get.ts           # Get single entity by identifier  
├── list.ts          # List/filter entities
├── update.ts        # Update entity properties
├── remove.ts        # Remove entities
└── index.ts         # Tool registration aggregator
```

## Tool Usage Examples

### Board Management

#### Create Board
**Request:**
```
Tool: create_board
Arguments:
  name: "Project Alpha"
  description: "Development board for Project Alpha"
  filename: "alpha.knbn"
```

**Response:**
```
Board 'Project Alpha' created successfully in alpha.knbn
```

#### Get Board
**Request:**
```
Tool: get_board
Arguments:
  filename: "alpha.knbn"
```

**Response:**
```json
{
  "name": "Project Alpha",
  "description": "Development board for Project Alpha",
  "columns": ["To Do", "In Progress", "Done"],
  "tasks": [],
  "labels": [],
  "sprints": []
}
```

### Task Management

#### Create Task
**Request:**
```
Tool: create_task
Arguments:
  title: "Implement user authentication"
  description: "Add login and registration functionality"
  column: "To Do"
  priority: 1
  storyPoints: 5
  labels: ["backend", "security"]
  filename: "alpha.knbn"
```

**Response:**
```
Task 'Implement user authentication' created with ID 1
```

#### Update Task
**Request:**
```
Tool: update_task
Arguments:
  id: 1
  column: "In Progress"
  priority: 2
  filename: "alpha.knbn"
```

**Response:**
```
Task 1 updated successfully
```

#### Update Multiple Tasks (Batch)
**Request:**
```
Tool: update_tasks_batch
Arguments:
  updates:
    1:
      column: "In Progress"
      priority: 1
    2:
      title: "Updated Task 2"
      storyPoints: 8
    3:
      column: "Done"
      labels: ["feature", "completed"]
  filename: "alpha.knbn"
```

**Response:**
```json
{
  "updatedCount": 3,
  "tasks": {
    "1": {
      "id": 1,
      "title": "Implement user authentication",
      "column": "In Progress",
      "priority": 1,
      "dates": {
        "created": "2024-01-15T10:30:00Z",
        "updated": "2024-01-15T11:00:00Z",
        "moved": "2024-01-15T11:00:00Z"
      }
    },
    "2": {
      "id": 2,
      "title": "Updated Task 2",
      "storyPoints": 8,
      "dates": {
        "created": "2024-01-15T10:35:00Z",
        "updated": "2024-01-15T11:00:00Z"
      }
    },
    "3": {
      "id": 3,
      "column": "Done",
      "labels": ["feature", "completed"],
      "dates": {
        "created": "2024-01-15T10:40:00Z",
        "updated": "2024-01-15T11:00:00Z",
        "moved": "2024-01-15T11:00:00Z"
      }
    }
  }
}
```

#### List Tasks
**Request:**
```
Tool: list_tasks
Arguments:
  column: "In Progress"
  filename: "alpha.knbn"
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Implement user authentication",
    "description": "Add login and registration functionality",
    "column": "In Progress",
    "priority": 2,
    "storyPoints": 5,
    "labels": ["backend", "security"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Column Management

#### Create Column
**Request:**
```
Tool: create_column
Arguments:
  name: "Code Review"
  position: 2
  filename: "alpha.knbn"
```

**Response:**
```
Column 'Code Review' created at position 2
```

#### List Columns
**Request:**
```
Tool: list_columns
Arguments:
  includeTasks: true
  filename: "alpha.knbn"
```

**Response:**
```json
[
  {
    "name": "To Do",
    "taskCount": 3
  },
  {
    "name": "Code Review",
    "taskCount": 0
  },
  {
    "name": "In Progress",
    "taskCount": 1
  },
  {
    "name": "Done",
    "taskCount": 5
  }
]
```

### Label Management

#### Add Label
**Request:**
```
Tool: add_label
Arguments:
  name: "urgent"
  color: "red"
  filename: "alpha.knbn"
```

**Response:**
```
Label 'urgent' added with color 'red'
```

### Sprint Management

#### Add Sprint
**Request:**
```
Tool: add_sprint
Arguments:
  name: "Sprint 1"
  description: "Initial development sprint"
  starts: "2024-01-15T00:00:00Z"
  ends: "2024-01-29T23:59:59Z"
  capacity: 20
  filename: "alpha.knbn"
```

**Response:**
```
Sprint 'Sprint 1' added successfully
```

#### List Sprints
**Request:**
```
Tool: list_sprints
Arguments:
  filter: "active"
  filename: "alpha.knbn"
```

**Response:**
```json
[
  {
    "name": "Sprint 1",
    "description": "Initial development sprint",
    "starts": "2024-01-15T00:00:00Z",
    "ends": "2024-01-29T23:59:59Z",
    "capacity": 20,
    "status": "active"
  }
]
```

### Board Migration

#### Migrate Single File
**Request:**
```
Tool: migrate
Arguments:
  files: ["old-board.knbn"]
```

**Response:**
```json
{
  "migratedCount": 1,
  "skippedCount": 0,
  "errorCount": 0,
  "results": [
    {
      "filename": "old-board.knbn",
      "status": "migrated",
      "fromVersion": "0.1",
      "toVersion": "0.2",
      "message": "Migrated from 0.1 to 0.2",
      "backupCreated": false
    }
  ],
  "summary": "Migration Summary:\n  Migrated: 1 files\n  Already current: 0 files"
}
```

#### Migrate All Files with Backup
**Request:**
```
Tool: migrate
Arguments:
  all: true
  backup: true
```

**Response:**
```json
{
  "migratedCount": 2,
  "skippedCount": 1,
  "errorCount": 0,
  "results": [
    {
      "filename": "board1.knbn",
      "status": "migrated",
      "fromVersion": "0.1",
      "toVersion": "0.2",
      "message": "Migrated from 0.1 to 0.2",
      "backupCreated": true
    },
    {
      "filename": "board2.knbn",
      "status": "migrated",
      "fromVersion": "0.1",
      "toVersion": "0.2",
      "message": "Migrated from 0.1 to 0.2",
      "backupCreated": true
    },
    {
      "filename": "current.knbn",
      "status": "skipped",
      "fromVersion": "0.2",
      "toVersion": "0.2",
      "message": "Already at latest version (0.2)"
    }
  ],
  "summary": "Migration Summary:\n  Migrated: 2 files\n  Already current: 1 files"
}
```

#### Dry-Run Migration
**Request:**
```
Tool: migrate
Arguments:
  files: ["board1.knbn", "board2.knbn"]
  dryRun: true
```

**Response:**
```json
{
  "migratedCount": 2,
  "skippedCount": 0,
  "errorCount": 0,
  "results": [
    {
      "filename": "board1.knbn",
      "status": "migrated",
      "fromVersion": "0.1",
      "toVersion": "0.2",
      "message": "Would migrate from 0.1 to 0.2"
    },
    {
      "filename": "board2.knbn",
      "status": "migrated",
      "fromVersion": "0.1",
      "toVersion": "0.2",
      "message": "Would migrate from 0.1 to 0.2"
    }
  ],
  "summary": "Migration Summary:\n  Would migrate: 2 files\n  Already current: 0 files\n\nRun without dryRun to perform the migration."
}
```

## Available Tools Reference

### Board Tools
- `list_boards` - List all .knbn board files
- `get_board` - Get complete board contents
- `create_board` - Create new board with name and description
- `migrate` - Migrate board files to latest version with dry-run and backup options

### Task Tools
- `create_task` - Create task with title, description, priority, story points
- `get_task` - Get task details by ID
- `list_tasks` - List/filter tasks by column, label, priority, sprint
- `update_task` - Update task properties (title, column, priority, etc.)
- `update_tasks_batch` - Update multiple tasks at once with Record format

### Column Tools
- `create_column` - Add new column at specified position
- `list_columns` - List all columns with optional task counts
- `update_column` - Rename existing column
- `remove_column` - Delete column and move tasks

### Label Tools
- `add_label` - Create label with name and color
- `list_labels` - List all available labels
- `update_label` - Modify label name or color
- `remove_label` - Delete label from board

### Sprint Tools
- `add_sprint` - Create sprint with dates, capacity, description
- `list_sprints` - List sprints filtered by status (active/upcoming/completed)
- `update_sprint` - Modify sprint properties
- `remove_sprint` - Delete sprint

## MCP Resources

The server exposes board data through MCP resources for read-only access:

### Board Resource
```
URI: file://[filename]
Type: application/json
Description: Complete board data including tasks, columns, labels, sprints
```

**Example Resource Access:**
```
Resource: file://alpha.knbn
Content-Type: application/json
```

## Error Handling

All tools return structured error responses with clear messages:

**Common Error Scenarios:**
- Board file not found
- Invalid task ID
- Column doesn't exist
- Label name conflicts
- Sprint date validation errors

**Error Response Format:**
```
Error: [Category] - [Specific Issue]
Details: [Additional context]
```

## Integration Patterns

### Workflow Automation
```
1. Create board → Add columns → Create labels → Set up sprints
2. Create tasks → Assign to sprint → Move through columns
3. Filter and report on task progress
```

### Batch Operations
Multiple tool calls can be chained for complex operations:
```
1. list_tasks(filter: "high priority")
2. update_task(id: X, column: "In Progress") for each result
3. list_tasks(column: "In Progress") to verify
```

Use `update_tasks_batch` for efficient multi-task updates:
```
1. update_tasks_batch(updates: {1: {column: "Done"}, 2: {priority: 1}})
2. list_tasks(column: "Done") to verify completion
```

### Data Synchronization
Use resources for read-only data access and tools for modifications:
- Read board state via resources
- Modify via tools
- Validate changes via subsequent resource reads

## Development Integration

### MCP Server Configuration
```typescript
import { createMcpServer } from './src/server';

const server = createMcpServer();
server.connect({
  transport: 'stdio'
});
```

### Tool Registration
Tools are auto-registered from the tools directory structure. Each tool exports:
```typescript
export const toolDefinition = {
  name: string,
  description: string,
  inputSchema: JSONSchema
};

export async function handleTool(args: any): Promise<string> {
  // Implementation
}
```

### Resource Registration
Resources provide read-only access to board data:
```typescript
export async function listResources(): Promise<Resource[]>
export async function readResource(uri: string): Promise<string>
```


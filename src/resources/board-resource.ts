import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadBoard, loadBoardFields } from 'knbn-core/utils/board-files';
import { findBoardFiles } from 'knbn-core/actions/board';
import { pcwd } from 'knbn-core/utils/files';
import { Brands } from 'knbn-core/utils/ts';
import * as path from 'path';
import * as yaml from 'js-yaml';

export const registerBoardResources = (server: McpServer) => {
  // Register resource template for individual board files
  const boardTemplate = new ResourceTemplate(
    'knbn://board/{filename}',
    {
      list: async () => {
        try {
          const files = findBoardFiles(pcwd());
          const resources = files.map(file => {
            const filename = path.basename(file);
            try {
              const board = loadBoard(file);
              return {
                uri: `knbn://board/${filename}`,
                name: board.name || filename,
                description: board.description || `Board file: ${filename}`,
                mimeType: 'application/json',
              };
            } catch (e) {
              return {
                uri: `knbn://board/${filename}`,
                name: filename,
                description: `Board file: ${filename} (Error loading)`,
                mimeType: 'application/json',
              };
            }
          });
          return { resources };
        } catch (error) {
          return { resources: [] };
        }
      },
      complete: {
        filename: async () => {
          try {
            const files = findBoardFiles(pcwd());
            return files.map(file => path.basename(file));
          } catch (error) {
            return [];
          }
        }
      }
    }
  );

  server.registerResource(
    'KnBn Board Files',
    boardTemplate,
    {
      description: 'Individual KnBn board files with full board data',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        const match = uri.href.match(/knbn:\/\/board\/(.+)/);
        if (!match) {
          throw new Error('Invalid board URI format');
        }
        
        const filename = match[1];
        const filepath = Brands.Filepath(path.join(pcwd(), filename));
        
        const board = loadBoard(filepath);

        return {
          contents: [{
            type: 'text',
            text: JSON.stringify(board, null, 2),
            uri: uri.href,
          }],
        };
      } catch (error: any) {
        return {
          contents: [{
            type: 'text',
            text: JSON.stringify({ 
              error: error?.message || 'Unknown error loading board',
              uri: uri.href 
            }, null, 2),
            uri: uri.href,
          }],
        };
      }
    }
  );

  // Register resource template for board summaries
  const boardSummaryTemplate = new ResourceTemplate(
    'knbn://board/{filename}/summary',
    {
      list: async () => {
        try {
          const files = findBoardFiles(pcwd());
          const resources = files.map(file => {
            const filename = path.basename(file);
            try {
              const board = loadBoardFields(file, ['name']);
              return {
                uri: `knbn://board/${filename}/summary`,
                name: `${board.name || filename} - Summary`,
                description: `Summary view of board: ${filename}`,
                mimeType: 'application/json',
              };
            } catch (e) {
              return {
                uri: `knbn://board/${filename}/summary`,
                name: `${filename} - Summary`,
                description: `Summary view of board: ${filename} (Error loading)`,
                mimeType: 'application/json',
              };
            }
          });
          return { resources };
        } catch (error) {
          return { resources: [] };
        }
      },
      complete: {
        filename: async () => {
          try {
            const files = findBoardFiles(pcwd());
            return files.map(file => path.basename(file));
          } catch (error) {
            return [];
          }
        }
      }
    }
  );

  server.registerResource(
    'KnBn Board Summaries',
    boardSummaryTemplate,
    {
      description: 'Summary views of KnBn boards with key metrics',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        const match = uri.href.match(/knbn:\/\/board\/(.+)\/summary/);
        if (!match) {
          throw new Error('Invalid board summary URI format');
        }
        
        const filename = match[1];
        const filepath = Brands.Filepath(path.join(pcwd(), filename));
        
        const board = loadBoard(filepath);
        
        // Create a summary with key metrics
        const taskCounts = board.columns.map(column => ({
          column: column.name,
          count: Object.values(board.tasks).filter(task => task.column === column.name).length,
        }));

        const totalTasks = Object.keys(board.tasks).length;
        const labelCount = board.labels?.length || 0;
        const sprintCount = board.sprints?.length || 0;

        const summary = {
          name: board.name,
          description: board.description,
          version: board.metadata.version,
          totalTasks,
          totalColumns: board.columns.length,
          totalLabels: labelCount,
          totalSprints: sprintCount,
          tasksByColumn: taskCounts,
          dates: board.dates,
        };

        return {
          contents: [{
            type: 'text',
            text: JSON.stringify(summary, null, 2),
            uri: uri.href,
          }],
        };
      } catch (error: any) {
        return {
          contents: [{
            type: 'text',
            text: JSON.stringify({ 
              error: error?.message || 'Unknown error loading board summary',
              uri: uri.href 
            }, null, 2),
            uri: uri.href,
          }],
        };
      }
    }
  );

  // Register resource template for board tasks
  const boardTasksTemplate = new ResourceTemplate(
    'knbn://board/{filename}/tasks',
    {
      list: async () => {
        try {
          const files = findBoardFiles(pcwd());
          const resources = files.map(file => {
            const filename = path.basename(file);
            try {
              const board = loadBoardFields(file, ['name']);
              return {
                uri: `knbn://board/${filename}/tasks`,
                name: `${board.name || filename} - Tasks`,
                description: `All tasks from board: ${filename}`,
                mimeType: 'application/json',
              };
            } catch (e) {
              return {
                uri: `knbn://board/${filename}/tasks`,
                name: `${filename} - Tasks`,
                description: `All tasks from board: ${filename} (Error loading)`,
                mimeType: 'application/json',
              };
            }
          });
          return { resources };
        } catch (error) {
          return { resources: [] };
        }
      },
      complete: {
        filename: async () => {
          try {
            const files = findBoardFiles(pcwd());
            return files.map(file => path.basename(file));
          } catch (error) {
            return [];
          }
        }
      }
    }
  );

  server.registerResource(
    'KnBn Board Tasks',
    boardTasksTemplate,
    {
      description: 'All tasks from specific KnBn boards',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        const match = uri.href.match(/knbn:\/\/board\/(.+)\/tasks/);
        if (!match) {
          throw new Error('Invalid board tasks URI format');
        }
        
        const filename = match[1];
        const filepath = Brands.Filepath(path.join(pcwd(), filename));
        
        const board = loadBoard(filepath);

        return {
          contents: [{
            type: 'text',
            text: JSON.stringify(board.tasks, null, 2),
            uri: uri.href,
          }],
        };
      } catch (error: any) {
        return {
          contents: [{
            type: 'text',
            text: JSON.stringify({ 
              error: error?.message || 'Unknown error loading board tasks',
              uri: uri.href 
            }, null, 2),
            uri: uri.href,
          }],
        };
      }
    }
  );

  // Register a static resource for board list
  server.registerResource(
    'KnBn Board List',
    'knbn://boards',
    {
      description: 'List of all KnBn board files in the current directory',
      mimeType: 'application/json',
    },
    async () => {
      try {
        const files = findBoardFiles(pcwd());
        const boards = files.map(file => {
          try {
            const board = loadBoardFields(file, ['name', 'description']);
            return {
              filename: path.basename(file),
              filepath: file,
              name: board.name || 'Unnamed Board',
              description: board.description || '',
            };
          } catch (e) {
            return {
              filename: path.basename(file),
              filepath: file,
              name: 'Error Loading Board',
              description: 'Could not load board data',
            };
          }
        });

        return {
          contents: [{
            type: 'text',
            text: JSON.stringify(boards, null, 2),
            uri: 'knbn://boards',
          }],
        };
      } catch (error: any) {
        return {
          contents: [{
            type: 'text',
            text: JSON.stringify({ error: error?.message || 'Unknown error' }, null, 2),
            uri: 'knbn://boards',
          }],
        };
      }
    }
  );
};
import { registerUpdateTasksBatchTool } from '../../../src/tools/tasks/update-batch';
import { updateTasksBatch } from 'knbn/actions/task';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Brands } from 'knbn/utils/ts';
// @ts-ignore
import { createTempDir } from '../../test-utils';

// Mock the core action
jest.mock('knbn/actions/task', () => ({
  updateTasksBatch: jest.fn()
}));

// Mock the path and file utilities
jest.mock('knbn/utils/files', () => ({
  pcwd: () => '/test/cwd'
}));

describe('MCP update-tasks-batch tool', () => {
  let mockServer: McpServer;
  let mockUpdateTasksBatch: jest.MockedFunction<typeof updateTasksBatch>;
  let toolHandler: (args: any) => Promise<any>;

  beforeEach(() => {
    // Create a mock server with the registerTool method
    mockServer = {
      registerTool: jest.fn()
    } as any;

    mockUpdateTasksBatch = updateTasksBatch as jest.MockedFunction<typeof updateTasksBatch>;
    mockUpdateTasksBatch.mockClear();

    // Register the tool and capture the handler
    registerUpdateTasksBatchTool(mockServer);
    
    // Extract the tool handler from the mock call
    const toolCall = (mockServer.registerTool as jest.Mock).mock.calls[0];
    toolHandler = toolCall[2]; // The handler function is the third argument (name, schema, handler)
  });

  const createMockUpdateResult = (updates: Record<number, any>) => {
    const tasks: Record<number, any> = {};
    Object.keys(updates).forEach(idStr => {
      const id = parseInt(idStr, 10);
      tasks[id] = {
        id,
        title: `Task ${id}`,
        description: 'Description',
        column: 'todo',
        labels: [],
        dates: {
          created: '2024-01-01T10:00:00Z',
          updated: '2024-01-01T11:00:00Z'
        },
        ...updates[id]
      };
    });

    return {
      board: {
        name: 'Test Board',
        description: 'Test board',
        columns: [{ name: 'todo' }, { name: 'doing' }, { name: 'done' }],
        tasks,
        metadata: { nextId: 1, version: '0.2' },
        dates: { 
          created: '2024-01-01T09:00:00Z',
          updated: '2024-01-01T11:00:00Z',
          saved: '2024-01-01T11:00:00Z'
        }
      },
      tasks
    };
  };

  describe('successful updates', () => {
    it('should update multiple tasks with Record format', async () => {
      const updates = {
        1: { title: 'Updated Task 1', column: 'doing' },
        2: { priority: 1, storyPoints: 5 },
        3: { column: 'done', labels: ['feature'] }
      };

      mockUpdateTasksBatch.mockReturnValue(createMockUpdateResult(updates));

      const result = await toolHandler({
        updates,
        filename: 'test.knbn'
      });

      expect(mockUpdateTasksBatch).toHaveBeenCalledWith(
        Brands.Filepath('/test/cwd/test.knbn'),
        updates
      );

      expect(result.structuredContent).toBeDefined();
      expect(result.structuredContent.updatedCount).toBe(3);
      expect(result.structuredContent.tasks).toBeDefined();
      expect(Object.keys(result.structuredContent.tasks)).toEqual(['1', '2', '3']);
    });

    it('should update single task', async () => {
      const updates = {
        1: { title: 'Single Update', priority: 2 }
      };

      mockUpdateTasksBatch.mockReturnValue(createMockUpdateResult(updates));

      const result = await toolHandler({
        updates,
        filename: 'test.knbn'
      });

      expect(result.structuredContent.updatedCount).toBe(1);
      expect(result.structuredContent.tasks[1].title).toBe('Single Update');
      expect(result.structuredContent.tasks[1].priority).toBe(2);
    });

    it('should use default filename when not provided', async () => {
      const updates = {
        1: { title: 'Default filename test' }
      };

      mockUpdateTasksBatch.mockReturnValue(createMockUpdateResult(updates));

      await toolHandler({ updates });

      expect(mockUpdateTasksBatch).toHaveBeenCalledWith(
        Brands.Filepath('/test/cwd/.knbn'),
        updates
      );
    });

    it('should handle all task properties', async () => {
      const updates = {
        1: {
          title: 'Complex Task',
          description: 'Complex description',
          column: 'working',
          labels: ['urgent', 'bug'],
          priority: 1,
          storyPoints: 8,
          sprint: 'Sprint 1'
        }
      };

      mockUpdateTasksBatch.mockReturnValue(createMockUpdateResult(updates));

      const result = await toolHandler({
        updates,
        filename: 'complex.knbn'
      });

      expect(result.structuredContent.tasks[1]).toMatchObject({
        title: 'Complex Task',
        description: 'Complex description',
        column: 'working',
        labels: ['urgent', 'bug'],
        priority: 1,
        storyPoints: 8,
        sprint: 'Sprint 1'
      });
    });

    it('should filter out undefined values from updates', async () => {
      const updates = {
        1: {
          title: 'Defined Title',
          description: undefined,
          column: 'doing',
          priority: undefined
        }
      };

      // Mock to verify the filtered updates were passed
      const expectedFiltered = {
        1: {
          title: 'Defined Title',
          column: 'doing'
        }
      };

      mockUpdateTasksBatch.mockReturnValue(createMockUpdateResult(expectedFiltered));

      await toolHandler({ updates });

      // Verify that undefined values were filtered out
      expect(mockUpdateTasksBatch).toHaveBeenCalledWith(
        expect.any(String),
        expectedFiltered
      );
    });

    it('should return correct task structure', async () => {
      const updates = {
        1: { title: 'Structure Test' }
      };

      const mockResult = createMockUpdateResult(updates);
      mockUpdateTasksBatch.mockReturnValue(mockResult);

      const result = await toolHandler({ updates });

      expect(result.structuredContent.tasks[1]).toMatchObject({
        id: 1,
        title: 'Structure Test',
        description: expect.any(String),
        column: expect.any(String),
        dates: {
          created: expect.any(String),
          updated: expect.any(String)
        }
      });
    });
  });

  describe('error handling', () => {
    it('should return error when no updates provided', async () => {
      const result = await toolHandler({});

      expect(result.isError).toBe(true);
      expect(result.contents[0].text).toContain('No task updates specified');
    });

    it('should return error when updates is empty object', async () => {
      const result = await toolHandler({ updates: {} });

      expect(result.isError).toBe(true);
      expect(result.contents[0].text).toContain('No task updates specified');
    });

    it('should return error when core function throws', async () => {
      const updates = {
        1: { title: 'Test' }
      };

      mockUpdateTasksBatch.mockImplementation(() => {
        throw new Error('Task with ID 1 not found on the board.');
      });

      const result = await toolHandler({ updates });

      expect(result.isError).toBe(true);
      expect(result.contents[0].text).toContain('Task with ID 1 not found on the board.');
    });

    it('should handle generic errors', async () => {
      const updates = {
        1: { title: 'Test' }
      };

      mockUpdateTasksBatch.mockImplementation(() => {
        throw new Error('Generic error');
      });

      const result = await toolHandler({ updates });

      expect(result.isError).toBe(true);
      expect(result.contents[0].text).toContain('Generic error');
    });

    it('should handle unknown errors', async () => {
      const updates = {
        1: { title: 'Test' }
      };

      mockUpdateTasksBatch.mockImplementation(() => {
        throw 'String error';
      });

      const result = await toolHandler({ updates });

      expect(result.isError).toBe(true);
      expect(result.contents[0].text).toContain('String error');
    });

    it('should handle null error', async () => {
      const updates = {
        1: { title: 'Test' }
      };

      mockUpdateTasksBatch.mockImplementation(() => {
        throw null;
      });

      const result = await toolHandler({ updates });

      expect(result.isError).toBe(true);
      expect(result.contents[0].text).toContain('Unknown error updating tasks');
    });
  });

  describe('input validation', () => {
    it('should handle numeric keys in updates object', async () => {
      const updates = {
        1: { title: 'Numeric key test' },
        2: { column: 'doing' }
      };

      mockUpdateTasksBatch.mockReturnValue(createMockUpdateResult(updates));

      const result = await toolHandler({ updates });

      expect(result.structuredContent.updatedCount).toBe(2);
      expect(mockUpdateTasksBatch).toHaveBeenCalledWith(
        expect.any(String),
        updates
      );
    });

    it('should handle string numeric keys in updates object', async () => {
      const updates = {
        '1': { title: 'String key test' },
        '2': { column: 'doing' }
      };

      mockUpdateTasksBatch.mockReturnValue(createMockUpdateResult(updates));

      const result = await toolHandler({ updates });

      expect(result.structuredContent.updatedCount).toBe(2);
    });
  });

  describe('tool registration', () => {
    it('should register tool with correct name and schema', () => {
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        'update_tasks_batch',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should register with correct arguments', () => {
      expect(mockServer.registerTool).toHaveBeenCalledTimes(1);
      const [toolName, toolSchema, toolHandler] = (mockServer.registerTool as jest.Mock).mock.calls[0];
      
      expect(toolName).toBe('update_tasks_batch');
      expect(typeof toolSchema).toBe('object');
      expect(typeof toolHandler).toBe('function');
    });
  });
});
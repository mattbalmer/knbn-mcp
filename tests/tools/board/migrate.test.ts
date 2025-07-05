import * as fs from 'fs';
import * as path from 'path';
import { registerMigrateTool } from '../../../src/tools/board/migrate';
import { createTempDir, rmTempDir } from '../../test-utils';
import { loadBoard } from 'knbn-core/utils/board-files';
import { Filepath } from 'knbn-core/types/ts';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('MCP Migrate Tool', () => {
  let tempDir: string;
  let originalCwd: string;
  let server: McpServer;
  let migrateTool: any;

  beforeEach(() => {
    tempDir = createTempDir('knbn-mcp-migrate');
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Create mock server
    server = {
      registerTool: jest.fn((name, toolDef, handler) => {
        migrateTool = { name, toolDef, handler };
        return { name };
      })
    } as any;
    
    registerMigrateTool(server);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmTempDir('knbn-mcp-migrate');
  });

  const callTool = async (args: any) => {
    const result = await migrateTool.handler(args, {});
    return result.structuredContent;
  };

  const createOldVersionBoard = (filename: string) => {
    const oldBoard = {
      configuration: {
        name: 'Test Board',
        description: 'Test board description',
        columns: ['To Do', 'In Progress', 'Done']
      },
      tasks: {},
      sprints: {},
      metadata: {
        nextId: 1,
        version: '0.1',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastModified: '2024-01-01T00:00:00.000Z'
      }
    };
    fs.writeFileSync(filename, JSON.stringify(oldBoard, null, 2));
  };

  const createCurrentVersionBoard = (filename: string) => {
    const currentBoard = {
      name: 'Current Board',
      description: 'Already current',
      columns: ['To Do', 'In Progress', 'Done'],
      tasks: {},
      labels: [],
      sprints: [],
      metadata: {
        nextId: 1,
        version: '0.2'
      },
      dates: {
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
        saved: '2024-01-01T00:00:00.000Z'
      }
    };
    fs.writeFileSync(filename, JSON.stringify(currentBoard, null, 2));
  };

  describe('tool definition', () => {
    it('should have correct name and description', () => {
      expect(migrateTool.name).toBe('migrate');
      expect(migrateTool.toolDef.description).toContain('Migrate board files to the latest version');
    });

    it('should validate that either files or all is required', async () => {
      await expect(callTool({})).rejects.toThrow('Either files array or all flag must be specified');
    });
  });

  describe('single file migration', () => {
    it('should migrate a single board file', async () => {
      createOldVersionBoard('test.knbn');
      
      const result = await callTool({ files: ['test.knbn'] });
      
      expect(result.migratedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('migrated');
      expect(result.results[0].filename).toBe('test.knbn');
      expect(result.results[0].fromVersion).toBe('0.1');
      expect(result.results[0].toVersion).toBe('0.2');
      
      // Verify board was actually migrated
      const board = loadBoard(path.join(tempDir, 'test.knbn') as Filepath);
      expect(board.metadata.version).toBe('0.2');
      expect(board.name).toBe('Test Board');
    });

    it('should skip files already at latest version', async () => {
      createCurrentVersionBoard('current.knbn');
      
      const result = await callTool({ files: ['current.knbn'] });
      
      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.results[0].status).toBe('skipped');
      expect(result.results[0].message).toContain('Already at latest version');
    });

    it('should handle non-existent files', async () => {
      const result = await callTool({ files: ['nonexistent.knbn'] });
      
      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.results[0].status).toBe('error');
      expect(result.results[0].message).toContain('File not found');
    });

    it('should handle invalid board files', async () => {
      fs.writeFileSync('invalid.knbn', 'invalid: yaml: [content');
      
      const result = await callTool({ files: ['invalid.knbn'] });
      
      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.results[0].status).toBe('error');
      expect(result.results[0].message).toContain('Invalid board file format');
    });

    it('should handle files without version metadata', async () => {
      const noVersion = { name: 'No Version', description: 'Missing version' };
      fs.writeFileSync('no-version.knbn', JSON.stringify(noVersion));
      
      const result = await callTool({ files: ['no-version.knbn'] });
      
      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.results[0].status).toBe('error');
      expect(result.results[0].message).toContain('Invalid board file format');
    });
  });

  describe('multiple file migration', () => {
    it('should migrate multiple board files', async () => {
      createOldVersionBoard('board1.knbn');
      createOldVersionBoard('board2.knbn');
      
      const result = await callTool({ files: ['board1.knbn', 'board2.knbn'] });
      
      expect(result.migratedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(2);
      
      // Verify both boards were migrated
      const board1 = loadBoard(path.join(tempDir, 'board1.knbn') as Filepath);
      const board2 = loadBoard(path.join(tempDir, 'board2.knbn') as Filepath);
      expect(board1.metadata.version).toBe('0.2');
      expect(board2.metadata.version).toBe('0.2');
    });

    it('should handle mixed results (some migrate, some skip, some error)', async () => {
      createOldVersionBoard('old.knbn');
      createCurrentVersionBoard('current.knbn');
      fs.writeFileSync('invalid.knbn', 'invalid content');
      
      const result = await callTool({ 
        files: ['old.knbn', 'current.knbn', 'invalid.knbn', 'nonexistent.knbn'] 
      });
      
      expect(result.migratedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.errorCount).toBe(2);
      expect(result.results).toHaveLength(4);
      
      expect(result.results[0].status).toBe('migrated'); // old.knbn
      expect(result.results[1].status).toBe('skipped');  // current.knbn
      expect(result.results[2].status).toBe('error');    // invalid.knbn
      expect(result.results[3].status).toBe('error');    // nonexistent.knbn
    });
  });

  describe('--all flag functionality', () => {
    it('should migrate all .knbn files in current directory', async () => {
      createOldVersionBoard('board1.knbn');
      createOldVersionBoard('board2.knbn');
      createCurrentVersionBoard('board3.knbn');
      // Create non-knbn file that should be ignored
      fs.writeFileSync('readme.txt', 'not a board file');
      
      const result = await callTool({ all: true });
      
      expect(result.migratedCount).toBe(2);
      expect(result.skippedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(3);
      
      // Should only process .knbn files
      const processedFiles = result.results.map((r: any) => r.filename).sort();
      expect(processedFiles).toEqual(['board1.knbn', 'board2.knbn', 'board3.knbn']);
    });

    it('should handle empty directory with --all flag', async () => {
      const result = await callTool({ all: true });
      
      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(result.summary).toContain('No .knbn files found in current directory');
    });
  });

  describe('dry-run functionality', () => {
    it('should show what would be migrated without making changes', async () => {
      createOldVersionBoard('test.knbn');
      
      const result = await callTool({ files: ['test.knbn'], dryRun: true });
      
      expect(result.migratedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.results[0].status).toBe('migrated');
      expect(result.results[0].message).toContain('Would migrate from 0.1 to 0.2');
      expect(result.summary).toContain('Would migrate: 1 files');
      expect(result.summary).toContain('Run without dryRun to perform the migration');
      
      // Verify file was NOT actually migrated
      const fileContent = fs.readFileSync('test.knbn', 'utf8');
      const data = JSON.parse(fileContent);
      expect(data.metadata.version).toBe('0.1'); // Still old version
    });

    it('should combine dry-run with --all flag', async () => {
      createOldVersionBoard('board1.knbn');
      createOldVersionBoard('board2.knbn');
      createCurrentVersionBoard('board3.knbn');
      
      const result = await callTool({ all: true, dryRun: true });
      
      expect(result.migratedCount).toBe(2);
      expect(result.skippedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.summary).toContain('Would migrate: 2 files');
      
      // Verify no files were actually migrated
      const board1 = JSON.parse(fs.readFileSync('board1.knbn', 'utf8'));
      const board2 = JSON.parse(fs.readFileSync('board2.knbn', 'utf8'));
      expect(board1.metadata.version).toBe('0.1');
      expect(board2.metadata.version).toBe('0.1');
    });
  });

  describe('backup functionality', () => {
    it('should create backup files when backup flag is used', async () => {
      createOldVersionBoard('test.knbn');
      
      const result = await callTool({ files: ['test.knbn'], backup: true });
      
      expect(result.migratedCount).toBe(1);
      expect(result.results[0].backupCreated).toBe(true);
      
      // Verify backup file was created
      expect(fs.existsSync('test.knbn.bak')).toBe(true);
      
      // Verify backup contains original content (backup is JSON format)
      const backupContent = JSON.parse(fs.readFileSync('test.knbn.bak', 'utf8'));
      expect(backupContent.metadata.version).toBe('0.1');
      
      // Verify main file was migrated (main file is now YAML format)
      const migratedBoard = loadBoard(path.join(tempDir, 'test.knbn') as Filepath);
      expect(migratedBoard.metadata.version).toBe('0.2');
    });

    it('should create backup for multiple files', async () => {
      createOldVersionBoard('board1.knbn');
      createOldVersionBoard('board2.knbn');
      
      const result = await callTool({ 
        files: ['board1.knbn', 'board2.knbn'], 
        backup: true 
      });
      
      expect(result.migratedCount).toBe(2);
      expect(result.results[0].backupCreated).toBe(true);
      expect(result.results[1].backupCreated).toBe(true);
      
      // Verify both backup files exist
      expect(fs.existsSync('board1.knbn.bak')).toBe(true);
      expect(fs.existsSync('board2.knbn.bak')).toBe(true);
    });

    it('should not create backup files when backup flag is false', async () => {
      createOldVersionBoard('test.knbn');
      
      const result = await callTool({ files: ['test.knbn'], backup: false });
      
      expect(result.migratedCount).toBe(1);
      expect(result.results[0].backupCreated).toBe(false);
      expect(fs.existsSync('test.knbn.bak')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when neither files nor all flag is provided', async () => {
      await expect(callTool({})).rejects.toThrow('Either files array or all flag must be specified');
    });

    it('should handle migration errors gracefully', async () => {
      // Create a file that will cause migration to fail (simulate internal error)
      const badBoard = {
        metadata: { version: '999.0.0' }, // Invalid version that can't be migrated
        configuration: {},
        tasks: {}
      };
      fs.writeFileSync('bad.knbn', JSON.stringify(badBoard));
      
      const result = await callTool({ files: ['bad.knbn'] });
      
      expect(result.migratedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.results[0].status).toBe('error');
      expect(result.results[0].message).toContain('Migration failed');
    });
  });

  describe('summary generation', () => {
    it('should generate correct summary for normal migration', async () => {
      createOldVersionBoard('test.knbn');
      
      const result = await callTool({ files: ['test.knbn'] });
      
      expect(result.summary).toContain('Migration Summary:');
      expect(result.summary).toContain('Migrated: 1 files');
      expect(result.summary).toContain('Already current: 0 files');
      expect(result.summary).not.toContain('Errors:');
    });

    it('should include error count in summary when errors occur', async () => {
      const result = await callTool({ files: ['nonexistent.knbn'] });
      
      expect(result.summary).toContain('Errors: 1 files');
    });

    it('should show dry-run message in summary', async () => {
      createOldVersionBoard('test.knbn');
      
      const result = await callTool({ files: ['test.knbn'], dryRun: true });
      
      expect(result.summary).toContain('Would migrate: 1 files');
      expect(result.summary).toContain('Run without dryRun to perform the migration');
    });
  });
});
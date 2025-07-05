import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { migrateBoard } from 'knbn/utils/migrations';
import { saveBoard } from 'knbn/utils/board-files';
import { Brands } from 'knbn/utils/ts';
import * as yaml from 'js-yaml';
import { registerStructuredTool } from '../../patch';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface MigrateResult {
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  results: Array<{
    filename: string;
    status: 'migrated' | 'skipped' | 'error';
    fromVersion?: string;
    toVersion?: string;
    message: string;
    backupCreated?: boolean;
  }>;
  summary: string;
}

export const registerMigrateTool = (server: McpServer) =>
  registerStructuredTool(server, 'migrate',
    {
      title: 'Migrate Board Files',
      description: 'Migrate board files to the latest version with options for dry-run, backup, and batch processing',
      inputSchema: {
        files: z.array(z.string()).optional().describe('Board files to migrate (e.g., ["board1.knbn", "board2.knbn"])'),
        all: z.boolean().optional().describe('Migrate all .knbn files in the current directory'),
        dryRun: z.boolean().optional().describe('Show what would be migrated without making changes'),
        backup: z.boolean().optional().describe('Create backup files before migration (adds .bak extension)')
      },
      outputSchema: {
        migratedCount: z.number(),
        skippedCount: z.number(),
        errorCount: z.number(),
        results: z.array(z.object({
          filename: z.string(),
          status: z.enum(['migrated', 'skipped', 'error']),
          fromVersion: z.string().optional(),
          toVersion: z.string().optional(),
          message: z.string(),
          backupCreated: z.boolean().optional()
        })),
        summary: z.string()
      }
    },
    async (args) => {
      // Validate input
      if (!args.files && !args.all) {
        throw new Error('Either files array or all flag must be specified');
      }

      const { files, all, dryRun = false, backup = false } = args;
      
      let filesToMigrate: string[] = [];

      if (all) {
        // Find all .knbn files in current directory
        const currentDir = process.cwd();
        const allFiles = fs.readdirSync(currentDir);
        filesToMigrate = allFiles.filter(file => file.endsWith('.knbn'));
        
        if (filesToMigrate.length === 0) {
          return {
            structuredContent: {
              migratedCount: 0,
              skippedCount: 0,
              errorCount: 0,
              results: [],
              summary: 'No .knbn files found in current directory'
            }
          };
        }
      } else if (files && files.length > 0) {
        filesToMigrate = files;
      }

      let migratedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const results: MigrateResult['results'] = [];

      for (const filename of filesToMigrate) {
        const filepath = path.resolve(filename);
        
        if (!fs.existsSync(filepath)) {
          results.push({
            filename,
            status: 'error',
            message: `File not found: ${filename}`
          });
          errorCount++;
          continue;
        }

        try {
          // Load raw file content to check version
          const fileContent = fs.readFileSync(filepath, 'utf8');
          let rawData: any;
          
          try {
            rawData = yaml.load(fileContent) as any;
          } catch (yamlError) {
            results.push({
              filename,
              status: 'error',
              message: `Invalid board file format: ${filename}`
            });
            errorCount++;
            continue;
          }

          if (!rawData || !rawData.metadata || !rawData.metadata.version) {
            results.push({
              filename,
              status: 'error',
              message: `Invalid board file format: ${filename}`
            });
            errorCount++;
            continue;
          }

          const currentVersion = rawData.metadata.version;
          
          // Try to migrate
          const migratedBoard = migrateBoard(rawData);
          const newVersion = migratedBoard.metadata.version;

          if (currentVersion === newVersion) {
            results.push({
              filename,
              status: 'skipped',
              fromVersion: currentVersion,
              toVersion: newVersion,
              message: `Already at latest version (${currentVersion})`
            });
            skippedCount++;
            continue;
          }

          if (dryRun) {
            results.push({
              filename,
              status: 'migrated',
              fromVersion: currentVersion,
              toVersion: newVersion,
              message: `Would migrate from ${currentVersion} to ${newVersion}`
            });
            migratedCount++;
            continue;
          }

          // Create backup if requested
          let backupCreated = false;
          if (backup) {
            const backupPath = `${filepath}.bak`;
            fs.copyFileSync(filepath, backupPath);
            backupCreated = true;
          }

          // Save migrated board
          const filepathBrand = Brands.Filepath(filepath);
          saveBoard(filepathBrand, migratedBoard);
          
          results.push({
            filename,
            status: 'migrated',
            fromVersion: currentVersion,
            toVersion: newVersion,
            message: `Migrated from ${currentVersion} to ${newVersion}`,
            backupCreated
          });
          migratedCount++;

        } catch (error: any) {
          results.push({
            filename,
            status: 'error',
            message: `Migration failed - ${error?.message}`
          });
          errorCount++;
        }
      }

      // Generate summary
      let summary = 'Migration Summary:\n';
      if (dryRun) {
        summary += `  Would migrate: ${migratedCount} files\n`;
      } else {
        summary += `  Migrated: ${migratedCount} files\n`;
      }
      summary += `  Already current: ${skippedCount} files`;
      if (errorCount > 0) {
        summary += `\n  Errors: ${errorCount} files`;
      }

      if (dryRun && migratedCount > 0) {
        summary += '\n\nRun without dryRun to perform the migration.';
      }

      return {
        structuredContent: {
          migratedCount,
          skippedCount,
          errorCount,
          results,
          summary
        }
      };
    }
  );
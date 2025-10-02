# Sync Utility Tests

This directory contains unit tests for the sync-utility that syncs VA Design System documentation from GitHub to Cloudflare R2.

## Test Framework

Tests use **Vitest** with the **Cloudflare Workers pool** (same as the main MCP server tests).

## Test Coverage

### ✅ Fully Tested (31 passing tests)

**config.test.ts** (22 tests)
- Default configuration values
- CLI argument parsing (--dry-run, --verbose, --concurrency)
- Configuration merging

**markdown-finder.test.ts** (9 tests)
- `groupFilesByDirectory()` - Grouping files by directory path
- `calculateTotalSize()` - Summing file sizes

### ⚠️ Partially Tested (14 skipped tests)

**git-clone.test.ts** (10 skipped)
- Requires `node:child_process` (not available in Workers environment)
- Tests for `cloneOrPullRepo()` function

**config.test.ts** (4 skipped)
- Environment variable overrides
- Requires Node.js process.env manipulation

**markdown-finder.test.ts** (implicit skip)
- `findMarkdownFiles()` requires `glob` and `node:fs` modules
- Not compatible with Workers test environment

## Why Some Tests Are Skipped

The sync-utility is a **Node.js utility** that runs locally, but our test framework uses the **Cloudflare Workers environment** (for consistency with the MCP server).

Node.js-specific modules are not available in Workers:
- `node:child_process` (used by simple-git)
- `node:fs` (filesystem operations)
- `glob` (file pattern matching)
- Environment variables (process.env)

## Running Tests

```bash
# Run all sync-utility tests
npm test -- test/sync-utility

# Run specific test file
npm test -- test/sync-utility/config.test.ts

# Run with coverage
npm test:coverage -- test/sync-utility
```

## Test Results

```
Test Files  2 passed | 1 skipped (3)
Tests       31 passed | 14 skipped (45)
```

## Integration Testing

For complete coverage of Node.js-specific functionality:

1. **Manual Testing**: Run the sync-utility with dry-run mode
   ```bash
   cd sync-utility
   npm run sync:dry-run
   ```

2. **End-to-End Testing**: Verify the actual sync process
   ```bash
   cd sync-utility
   npm run sync
   ```

3. **Verify Results**: Check that files are correctly synced to R2

## Test Strategy

✅ **Unit test pure functions** that don't depend on Node.js modules
- Configuration parsing
- Data transformation utilities
- Type definitions

⚠️ **Skip tests** that require Node.js-specific modules
- Git operations
- File system operations
- Environment variable handling

✨ **Rely on manual/integration testing** for Node.js functionality
- Run dry-run to verify file discovery
- Run actual sync to verify end-to-end process
- TypeScript compilation catches most errors

## Adding New Tests

When adding tests for new functionality:

1. **Pure functions**: Write normal unit tests
2. **Node.js dependencies**: Skip with `.skip()` or mark as integration tests
3. **Type safety**: Ensure TypeScript compilation passes (`npm run type-check`)

# VA Design System Documentation Sync Utility

Automatically syncs markdown documentation from the [VA Design System Documentation repository](https://github.com/department-of-veterans-affairs/vets-design-system-documentation) to the Cloudflare R2 bucket (`vads-docs`) used by the VA Design System MCP server.

## Quick Start

```bash
# Install dependencies
npm install

# Authenticate with Cloudflare (one-time setup)
npx wrangler login

# Preview what will be synced (dry run)
npm run sync:dry-run

# Sync documentation to R2
npm run sync
```

## How It Works

1. **Clone/Pull**: Clones or pulls the latest docs from GitHub to `tmp/`
2. **Discover**: Finds all `.md` files in `src/` using smart discovery with exclusion patterns
3. **Upload**: Uploads files to R2 bucket, overwriting existing files and preserving directory structure

**Current Coverage:**
- ✅ 268 markdown files
- ✅ 1.33 MB total documentation
- ✅ Automatically adapts to directory structure changes

## Configuration

Edit `src/config.ts` to customize:

- **Repository URL**: Source GitHub repository
- **Base Directory**: Where to search for markdown files (default: `src/`)
- **Exclusion Patterns**: Files/directories to skip (build dirs, tests, assets, etc.)
- **R2 Bucket**: Target bucket name (default: `vads-docs`)

### Adding Exclusion Patterns

```typescript
// src/config.ts
smartDiscovery: {
  baseDirectory: 'src',
  excludePatterns: [
    'node_modules/**',
    '_site/**',
    // Add custom patterns:
    '**/*.draft.md',
    'internal-docs/**',
  ],
}
```

## Commands

```bash
npm run sync           # Full sync (uploads to R2)
npm run sync:dry-run   # Preview without uploading
npm run type-check     # TypeScript type checking
```

## Automation

### Cron (Linux/macOS)

```bash
crontab -e

# Daily sync at 2 AM
0 2 * * * cd /path/to/sync-utility && npm run sync >> sync.log 2>&1
```

### GitHub Actions

```yaml
name: Sync VA Docs
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd sync-utility && npm install
      - run: cd sync-utility && npm run sync
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Directory Structure

```
sync-utility/
├── src/
│   ├── sync-docs.ts          # Main orchestrator
│   ├── config.ts             # Configuration
│   ├── types.ts              # Type definitions
│   └── lib/
│       ├── git-clone.ts      # Git operations
│       ├── markdown-finder.ts # Smart file discovery
│       ├── r2-uploader.ts    # R2 upload logic
│       └── logger.ts         # Console logging
├── package.json
├── tsconfig.json
├── wrangler.jsonc            # R2 bucket config
└── README.md
```

## Overwrite Strategy

- ✅ Overwrites existing files with latest content
- ✅ Creates new files that don't exist
- ✅ Preserves directory structure
- ⚠️ Does NOT delete old files (stale files don't affect AutoRAG)

## Troubleshooting

**Git clone fails:**
- Check internet connectivity
- Verify GitHub URL is accessible

**R2 upload fails:**
- Run `npx wrangler login` to authenticate
- Verify Cloudflare account access

**Missing files:**
- Check exclusion patterns in `src/config.ts`
- Run `npm run sync:dry-run` to preview

## Isolation

This utility is completely isolated from the main MCP server:
- Separate `package.json` with own dependencies
- Independent TypeScript configuration
- Own Wrangler config (shares R2 bucket only)
- Can be extracted to separate repo if needed

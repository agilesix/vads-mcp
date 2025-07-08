# VA Design System MCP Tests

This directory contains the test suite for the VA Design System MCP server, running in the Cloudflare Workers runtime environment.

## Testing Infrastructure

Our tests run in the actual Cloudflare Workers runtime (workerd) using `@cloudflare/vitest-pool-workers`, ensuring test results accurately reflect production behavior.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `services/` - Unit tests for service classes (GitHubService, ComponentParser, etc.)
- `tools/` - Unit tests for individual MCP tools
- `integration/` - Integration tests using SELF fetcher for end-to-end testing
- `setup.ts` - Global test setup and utilities
- `env.d.ts` - TypeScript definitions for Cloudflare test environment

## Writing Tests

Tests are written using Vitest with Cloudflare Workers support:

### Unit Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { env } from "cloudflare:test";
import { MyService } from "../src/services/myService";

describe("MyService", () => {
  it("should process data correctly", () => {
    const service = new MyService();
    const result = service.processData("input");
    expect(result).toBe("expected output");
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from "vitest";
import { env, SELF } from "cloudflare:test";

describe("API Integration", () => {
  it("should handle requests", async () => {
    const response = await SELF.fetch("http://localhost/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("result");
  });
});
```

## Key Differences from Node.js Testing

1. **No Node.js APIs**: Tests run in Workers runtime, so Node.js-specific APIs are not available
2. **Use `cloudflare:test` imports**: Import `env` and `SELF` from `cloudflare:test` module
3. **SELF fetcher**: Use `SELF.fetch()` for integration testing your Worker
4. **Real Workers environment**: Tests run with actual Workers runtime APIs and constraints

## Test Utilities

The `test/setup.ts` file provides common utilities:

- `createMockRequest()` - Helper for creating mock Request objects

## Coverage

Coverage reports are generated in the `coverage/` directory. View the HTML report by opening `coverage/index.html` in a browser.

## Troubleshooting

- If tests fail with "module not found" errors, ensure you're not importing Node.js modules
- Use Workers-compatible APIs and libraries only
- Check `wrangler.jsonc` for proper configuration
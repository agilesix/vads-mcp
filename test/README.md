# VA Design System MCP Tests

This directory contains the test suite for the VA Design System MCP server.

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

- `services/` - Tests for service classes (GitHubService, ComponentParser, etc.)
- `tools/` - Tests for individual MCP tools
- `setup.ts` - Global test setup and configuration

## Writing Tests

Tests are written using Vitest with the following conventions:

1. Test files should be named `*.test.ts`
2. Use `describe` blocks to group related tests
3. Use `it` or `test` for individual test cases
4. Mock external dependencies using `vi.fn()`
5. Clear mocks in `beforeEach` to ensure test isolation

## Example Test

```typescript
import { describe, it, expect, vi } from "vitest";
import { MyClass } from "../src/myClass";

describe("MyClass", () => {
  it("should do something", () => {
    const instance = new MyClass();
    const result = instance.doSomething();
    expect(result).toBe("expected value");
  });
});
```

## Coverage

Coverage reports are generated in the `coverage/` directory. View the HTML report by opening `coverage/index.html` in a browser.
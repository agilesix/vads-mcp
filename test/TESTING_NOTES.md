# Testing Notes for VA Design System MCP Server

## Cloudflare Workers Testing Infrastructure

This project uses Vitest with the Cloudflare Workers pool (`@cloudflare/vitest-pool-workers`) to ensure tests run in the actual Workers runtime environment (workerd), not Node.js.

## Current Status

✅ **Working Tests:**
- Unit tests for services (ComponentParser)
- Unit tests for tool schemas
- Tests run in proper Workers runtime
- Coverage reporting configured

## Known Limitations

### MCP SDK Import Issues

The `@modelcontextprotocol/sdk` library has dependencies (particularly `ajv`) that use CommonJS module syntax incompatible with the Workers runtime in test mode. This causes `SyntaxError: Unexpected token ':'` errors when importing files that depend on the MCP SDK.

**Affected Areas:**
- Tool handler functions that import from MCP SDK
- Integration tests that test the full MCP server

**Workaround:**
- Test schemas and pure logic separately from MCP handlers
- Mock MCP SDK dependencies where possible
- Focus on testing business logic rather than MCP protocol integration

### AI Binding in Tests

Workers AI bindings cannot run locally and must be mocked in tests. The `test/setup.ts` file provides a `mockAI` object for this purpose.

## Testing Strategy

1. **Unit Tests**: Test pure functions, services, and utilities that don't depend on MCP SDK
2. **Schema Tests**: Validate Zod schemas used by tools
3. **Service Tests**: Test GitHubService, ComponentParser, etc. in isolation
4. **Integration Tests**: Limited due to MCP SDK issues, focus on testing with actual deployment

## Future Improvements

1. **Mock MCP SDK**: Create comprehensive mocks for MCP SDK to enable full integration testing
2. **E2E Tests**: Consider separate E2E test suite that tests deployed Worker
3. **Module Resolution**: Investigate bundling strategies to resolve CommonJS issues

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

## Writing New Tests

When writing tests:
1. Import from `cloudflare:test` for env and SELF
2. Avoid importing files that depend on MCP SDK directly
3. Use the mock utilities in `test/setup.ts`
4. Focus on testing business logic separately from MCP protocol handling
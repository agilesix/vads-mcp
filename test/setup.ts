import { vi } from "vitest";

// Mock the Cloudflare environment if needed
global.Env = {} as any;

// Add any global test setup here
beforeEach(() => {
	// Clear all mocks before each test
	vi.clearAllMocks();
});
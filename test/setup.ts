import { vi } from "vitest";

// Mock AI binding for tests
export const mockAI = {
	autorag: vi.fn((id: string) => ({
		search: vi.fn(async (params: any) => {
			// Mock search results
			return [
				{
					score: 0.8,
					document: "Mock search result for: " + params.query,
				},
			];
		}),
	})),
};

// Global test setup for Cloudflare Workers environment
beforeEach(() => {
	// Clear all mocks before each test
	vi.clearAllMocks();
	
	// Reset AI mock
	mockAI.autorag.mockClear();
});

// Add any global test utilities here
export const createMockRequest = (url: string, options?: RequestInit): Request => {
	return new Request(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
	});
};
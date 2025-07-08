import { describe, it, expect, vi } from "vitest";
import { listComponentsTool } from "../../src/tools/listComponents";

describe("listComponents Tool", () => {
	const mockGithubService = {
		fetchRawContent: vi.fn(),
	};

	const mockComponentParser = {
		extractComponentBlocks: vi.fn(),
		determineComponentStatus: vi.fn(),
		getRecommendation: vi.fn(),
	};

	const mockEnv = {} as Env;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should have correct name and schema", () => {
		expect(listComponentsTool.name).toBe("listComponents");
		expect(listComponentsTool.schema).toBeDefined();
		expect(listComponentsTool.schema.shape).toHaveProperty("status");
		expect(listComponentsTool.schema.shape).toHaveProperty("category");
		expect(listComponentsTool.schema.shape).toHaveProperty("includeMetadata");
		expect(listComponentsTool.schema.shape).toHaveProperty("sortBy");
	});

	it("should return error when services are not available", async () => {
		const result = await listComponentsTool.handler(
			{ status: "all", includeMetadata: true, sortBy: "name" },
			mockEnv,
		);

		expect(result.content[0].text).toContain("Error: Required services");
	});

	it("should fetch and process components successfully", async () => {
		const mockComponents = [
			{
				componentName: "Button",
				tagName: "va-button",
				maturityCategory: "",
				maturityLevel: "best_practice",
			},
			{
				componentName: "Alert",
				tagName: "va-alert",
				maturityCategory: "caution",
				maturityLevel: "candidate",
			},
		];

		mockGithubService.fetchRawContent.mockResolvedValue("mock content");
		mockComponentParser.extractComponentBlocks.mockReturnValue(mockComponents);
		mockComponentParser.determineComponentStatus.mockImplementation((cat, level) => {
			if (cat === "caution") return "USE_WITH_CAUTION";
			if (level === "best_practice") return "RECOMMENDED";
			return "UNKNOWN";
		});
		mockComponentParser.getRecommendation.mockReturnValue("Test recommendation");

		const result = await listComponentsTool.handler(
			{ status: "all", includeMetadata: false, sortBy: "name" },
			mockEnv,
			{
				github: mockGithubService,
				componentParser: mockComponentParser,
			},
		);

		expect(mockGithubService.fetchRawContent).toHaveBeenCalledWith(
			expect.stringContaining("components.d.ts"),
		);
		expect(mockComponentParser.extractComponentBlocks).toHaveBeenCalledWith("mock content");
		expect(result.content[0].text).toContain("VA Design System Components");
		expect(result.content[0].text).toContain("Alert");
		expect(result.content[0].text).toContain("Button");
	});

	it("should filter components by status", async () => {
		const mockComponents = [
			{
				componentName: "Button",
				tagName: "va-button",
				maturityCategory: "",
				maturityLevel: "best_practice",
			},
			{
				componentName: "Alert",
				tagName: "va-alert",
				maturityCategory: "",
				maturityLevel: "candidate",
			},
		];

		mockGithubService.fetchRawContent.mockResolvedValue("mock content");
		mockComponentParser.extractComponentBlocks.mockReturnValue(mockComponents);
		mockComponentParser.determineComponentStatus.mockImplementation((cat, level) => {
			if (level === "best_practice") return "RECOMMENDED";
			if (level === "candidate") return "EXPERIMENTAL";
			return "UNKNOWN";
		});
		mockComponentParser.getRecommendation.mockReturnValue("Test recommendation");

		const result = await listComponentsTool.handler(
			{ status: "RECOMMENDED", includeMetadata: false, sortBy: "name" },
			mockEnv,
			{
				github: mockGithubService,
				componentParser: mockComponentParser,
			},
		);

		expect(result.content[0].text).toContain("Button");
		expect(result.content[0].text).not.toContain("Alert");
		expect(result.content[0].text).toContain("(1 total)");
	});

	it("should handle errors gracefully", async () => {
		mockGithubService.fetchRawContent.mockRejectedValue(new Error("Network error"));

		const result = await listComponentsTool.handler(
			{ status: "all", includeMetadata: true, sortBy: "name" },
			mockEnv,
			{
				github: mockGithubService,
				componentParser: mockComponentParser,
			},
		);

		expect(result.content[0].text).toContain("Error fetching components");
		expect(result.content[0].text).toContain("Network error");
	});
});
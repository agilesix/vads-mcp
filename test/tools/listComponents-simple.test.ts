import { describe, it, expect } from "vitest";
import { listComponentsSchema } from "../../src/tools/listComponents";
import { ComponentStatus } from "../../src/types";

describe("listComponents Tool Schema", () => {
	it("should have correct schema definition", () => {
		expect(listComponentsSchema).toBeDefined();
		expect(listComponentsSchema.shape).toHaveProperty("status");
		expect(listComponentsSchema.shape).toHaveProperty("category");
		expect(listComponentsSchema.shape).toHaveProperty("includeMetadata");
		expect(listComponentsSchema.shape).toHaveProperty("sortBy");
	});

	it("should have correct default values", () => {
		const parsed = listComponentsSchema.parse({});
		expect(parsed.status).toBe("all");
		expect(parsed.includeMetadata).toBe(true);
		expect(parsed.sortBy).toBe("name");
	});

	it("should validate status enum values", () => {
		const validStatuses = [
			ComponentStatus.RECOMMENDED,
			ComponentStatus.STABLE, 
			ComponentStatus.EXPERIMENTAL,
			ComponentStatus.AVAILABLE_WITH_ISSUES,
			ComponentStatus.USE_WITH_CAUTION,
			ComponentStatus.UNKNOWN,
			"all",
		];

		for (const status of validStatuses) {
			const result = listComponentsSchema.parse({ status });
			expect(result.status).toBe(status);
		}
	});

	it("should validate sortBy enum values", () => {
		const validSortBy = ["name", "status", "maturityLevel"];

		for (const sortBy of validSortBy) {
			const result = listComponentsSchema.parse({ sortBy });
			expect(result.sortBy).toBe(sortBy);
		}
	});
});

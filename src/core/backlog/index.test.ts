import { beforeEach, describe, expect, it, vi } from "vitest";
import { BacklogApiClient } from "./backlogApiClient.js";
import { BacklogIssueService } from "./backlogIssueService.js";
import * as backlogUtils from "./backlogUtils.js";

// Configuration options for Backlog API client
const opts = {
	host: "example.backlog.com",
	apiKey: "dummy",
	projectIdOrKey: "TEST",
	summaryPrefix: "[prefix]",
	issueTypeIdOrName: "Bug",
	priorityIdOrName: "High",
	initialStatusIdOrName: "Open",
	completedStatusIdOrName: "Closed",
};

// Sample GitHub issue data
const githubIssue = {
	id: 123,
	number: 1,
	title: "Test Issue",
	body: "body text",
	html_url: "https://github.com/org/repo/issues/1",
	state: "open",
	state_reason: null,
	user: { login: "test-user", id: 42 },
} as const;

// Test suite for Backlog/GitHub tag utility functions
describe("backlogUtils", () => {
	// Test extracting key from text surrounded by other text
	it("extracts key when surrounded by text", () => {
		const text = "foo backlog [#ABC-123](https://host/view/ABC-123) bar";
		expect(backlogUtils.extractBacklogTag(text)).toBe("ABC-123");
	});

	// Test case insensitivity of extraction
	it("is case insensitive", () => {
		const text = "BaCkLoG [#XYZ](https://host/view/XYZ)";
		expect(backlogUtils.extractBacklogTag(text)).toBe("XYZ");
	});

	// Test returning null when no backlog tag is present
	it("returns null when no backlog tag present", () => {
		const text = "no backlog here";
		expect(backlogUtils.extractBacklogTag(text)).toBeNull();
	});

	// Test creating a proper markdown link
	it("creates proper markdown link", () => {
		const tag = backlogUtils.makeBacklogTag("KEY", "wmnbdev.backlog.com");
		expect(tag).toBe("backlog [#KEY](https://wmnbdev.backlog.com/view/KEY)");
	});
});

// Test suite for BacklogIssueService with mocked API
describe("BacklogIssueService (with mocked api)", () => {
	let api: BacklogApiClient;
	let service: BacklogIssueService;

	// Set up mocked API and service before each test
	beforeEach(() => {
		api = new BacklogApiClient(opts);
		service = new BacklogIssueService(api, opts);

		// Mock API responses
		api.getProject = vi.fn().mockResolvedValue({
			isOk: () => true,
			isErr: () => false,
			value: { id: 1 },
		});
		api.getIssueTypes = vi.fn().mockResolvedValue({
			isOk: () => true,
			isErr: () => false,
			value: [{ id: 2, name: "Bug" }],
		});
		api.getPriorities = vi.fn().mockResolvedValue({
			isOk: () => true,
			isErr: () => false,
			value: [{ id: 3, name: "High" }],
		});
		api.getProjectStatuses = vi.fn().mockResolvedValue({
			isOk: () => true,
			isErr: () => false,
			value: [
				{ id: 4, name: "Open" },
				{ id: 5, name: "Closed" },
			],
		});
		api.postIssue = vi.fn().mockResolvedValue({
			isOk: () => true,
			isErr: () => false,
			value: { issueKey: "ABC-123" },
		});
		api.patchIssue = vi.fn().mockResolvedValue({
			isOk: () => true,
			isErr: () => false,
			value: { issueKey: "ABC-123" },
		});
	});

	// Test creating a backlog issue and returning the tag
	it("should create a backlog issue and return tag", async () => {
		await service.init();
		const result = await service.createIssue(githubIssue);
		expect(result).toBe(
			"backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		);
	});

	// Test updating a backlog issue and returning the tag
	it("should update a backlog issue and return tag", async () => {
		await service.init();
		const issue = {
			...githubIssue,
			body: "backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		};
		const result = await service.updateIssue(issue);
		expect(result).toBe(
			"backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		);
	});

	// Test closing a backlog issue and returning the tag
	it("should close a backlog issue and return tag", async () => {
		await service.init();
		const issue = {
			...githubIssue,
			body: "backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		};
		const result = await service.closeIssue(issue);
		expect(result).toBe(
			"backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		);
	});

	// Test returning undefined if no backlog tag is present in updateIssue
	it("should return undefined if no backlog tag in updateIssue", async () => {
		await service.init();
		const result = await service.updateIssue({
			...githubIssue,
			body: "no tag here",
		});
		expect(result).toBeUndefined();
	});

	// Test returning undefined if no backlog tag is present in closeIssue
	it("should return undefined if no backlog tag in closeIssue", async () => {
		await service.init();
		const result = await service.closeIssue({
			...githubIssue,
			body: "no tag here",
		});
		expect(result).toBeUndefined();
	});

	// Test error handling when getProject fails in init
	it("should error if getProject fails in init", async () => {
		api.getProject = vi.fn().mockResolvedValue({
			isOk: () => false,
			isErr: () => true,
			error: new Error("getProject failed"),
		});
		await expect(service.init()).rejects.toThrow("Failed to get project");
	});

	// Test error handling when postIssue fails in createIssue
	it("should error if postIssue fails in createIssue", async () => {
		await service.init();
		api.postIssue = vi.fn().mockResolvedValue({
			isOk: () => false,
			isErr: () => true,
			error: new Error("postIssue failed"),
		});
		await expect(service.createIssue(githubIssue)).rejects.toThrow(
			"Failed to create issue",
		);
	});

	// Test error handling when patchIssue fails in updateIssue
	it("should error if patchIssue fails in updateIssue", async () => {
		await service.init();
		api.patchIssue = vi.fn().mockResolvedValue({
			isOk: () => false,
			isErr: () => true,
			error: new Error("patchIssue failed"),
		});
		const issue = {
			...githubIssue,
			body: "backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		};
		await expect(service.updateIssue(issue)).rejects.toThrow(
			"Failed to update issue",
		);
	});
});

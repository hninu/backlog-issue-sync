import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fixtures from "./backlog.fixtures.js";

const BacklogMock = vi
	.fn<() => typeof fixtures>()
	.mockImplementation(() => fixtures);

// Prepare mocks for backlog-js
vi.mock("backlog-js", () => {
	return {
		default: {
			Backlog: BacklogMock,
		},
	};
});

const { Backlog } = await import("./index.js");

describe("Backlog.backlogRegex", () => {
	it("extracts key when surrounded by text", () => {
		const text = "foo backlog [#ABC-123](https://host/view/ABC-123) bar";
		expect(Backlog.extractBacklogTag(text)).toBe("ABC-123");
	});
	it("is case insensitive", () => {
		const text = "BaCkLoG [#XYZ](https://host/view/XYZ)";
		expect(Backlog.extractBacklogTag(text)).toBe("XYZ");
	});
	it("returns null when no backlog tag present", () => {
		const text = "no backlog here";
		expect(Backlog.extractBacklogTag(text)).toBeNull();
	});
});

describe("makeBacklogTag", () => {
	it("creates proper markdown link", () => {
		const tag = Backlog.makeBacklogTag("KEY", "wmnbdev.backlog.com");
		expect(tag).toBe("backlog [#KEY](https://wmnbdev.backlog.com/view/KEY)");
	});
});

describe("Backlog class (with mocked backlog-js)", () => {
	beforeEach(() => {
		BacklogMock.mockClear().mockImplementation(() => fixtures);
	});

	// Add all required properties for BacklogOptions
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

	// Add all required properties for GithubIssue
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

	it("should create a backlog issue and return tag", async () => {
		const backlog = new Backlog(opts);
		await backlog.init();
		const tag = await backlog.issueCreate(githubIssue);
		expect(tag).toBe(
			"backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		);
	});

	it("should update a backlog issue and return tag", async () => {
		const backlog = new Backlog(opts);
		await backlog.init();
		const issue = {
			...githubIssue,
			body: "backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		};
		const tag = await backlog.issueUpdate(issue);
		expect(tag).toBe(
			"backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		);
	});

	it("should close a backlog issue and return tag", async () => {
		const backlog = new Backlog(opts);
		await backlog.init();
		const issue = {
			...githubIssue,
			body: "backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		};
		const tag = await backlog.issueClose(issue);
		expect(tag).toBe(
			"backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		);
	});
});

describe("Backlog error cases (with mocked backlog-js)", () => {
	beforeEach(() => {
		BacklogMock.mockClear().mockImplementation(() => fixtures);
	});

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

	it("should throw if getProject fails in init", async () => {
		BacklogMock.mockImplementation(() => ({
			...fixtures,
			getProject: vi.fn().mockRejectedValue(new Error("getProject failed")),
		}));
		const { Backlog } = await import("./index.js");
		const backlog = new Backlog(opts);
		await expect(backlog.init()).rejects.toThrow("getProject failed");
	});

	it("should throw if postIssue fails in issueCreate", async () => {
		fixtures.postIssue
			.mockClear()
			.mockRejectedValue(new Error("postIssue failed"));
		const { Backlog } = await import("./index.js");
		const backlog = new Backlog(opts);
		await backlog.init();
		await expect(backlog.issueCreate(githubIssue)).rejects.toThrow(
			"postIssue failed",
		);
	});

	it("should throw if patchIssue fails in issueUpdate", async () => {
		fixtures.patchIssue
			.mockClear()
			.mockRejectedValue(new Error("patchIssue failed"));
		const { Backlog } = await import("./index.js");
		const backlog = new Backlog(opts);
		await backlog.init();
		const issue = {
			...githubIssue,
			body: "backlog [#ABC-123](https://example.backlog.com/view/ABC-123)",
		};
		await expect(backlog.issueUpdate(issue)).rejects.toThrow(
			"patchIssue failed",
		);
	});

	it("should return undefined if no backlog tag in issueUpdate", async () => {
		const { Backlog } = await import("./index.js");
		const backlog = new Backlog(opts);
		await backlog.init();
		const issue = { ...githubIssue, body: "no tag here" };
		const result = await backlog.issueUpdate(issue);
		expect(result).toBeUndefined();
	});

	it("should return undefined if no backlog tag in issueClose", async () => {
		const { Backlog } = await import("./index.js");
		const backlog = new Backlog(opts);
		await backlog.init();
		const issue = { ...githubIssue, body: "no tag here" };
		const result = await backlog.issueClose(issue);
		expect(result).toBeUndefined();
	});
});

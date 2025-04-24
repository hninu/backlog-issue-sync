import type { Issue, Project } from "backlog-js/dist/types/entity.js";
import { type Result, err, ok } from "neverthrow";
import type { BacklogOptions, GithubIssue } from "../../type.js";
import type { BacklogApiClient } from "./backlogApiClient.js";
import {
	extractBacklogTag,
	makeBacklogTag,
	makeGithubTag,
} from "./backlogUtils.js";

/**
 * Service for Backlog issue operations (business logic and state management).
 */
export class BacklogIssueService {
	/**
	 * Project ID.
	 */
	private projectId = 0;

	/**
	 * Issue type.
	 */
	private issueType: Issue.IssueType | undefined;

	/**
	 * Priority.
	 */
	private priority: Issue.Priority | undefined;

	/**
	 * Initial status.
	 */
	private initialStatus: Project.ProjectStatus | undefined;

	/**
	 * Completed status.
	 */
	private completedStatus: Project.ProjectStatus | undefined;

	/**
	 * Constructor.
	 *
	 * @param api Backlog API client.
	 * @param opts Backlog options.
	 */
	constructor(
		private api: BacklogApiClient,
		private opts: BacklogOptions,
	) {}

	/**
	 * Initialize project, issue type, priority, and status info.
	 */
	public async init(): Promise<Result<void, Error>> {
		const projectRes = await this.api.getProject(this.opts.projectIdOrKey);
		if (projectRes.isErr()) return err(new Error("Failed to get project"));
		this.projectId = projectRes.value.id;

		const issueTypesRes = await this.api.getIssueTypes(this.projectId);
		if (issueTypesRes.isErr())
			return err(new Error("Failed to get issue types"));
		const foundType = issueTypesRes.value.find(
			(t) =>
				t.name === this.opts.issueTypeIdOrName ||
				t.id === Number(this.opts.issueTypeIdOrName),
		);
		if (!foundType) return err(new Error("Issue type not found"));
		this.issueType = foundType;

		const prioritiesRes = await this.api.getPriorities();
		if (prioritiesRes.isErr())
			return err(new Error("Failed to get priorities"));
		const foundPriority = prioritiesRes.value.find(
			(p) =>
				p.name === this.opts.priorityIdOrName ||
				p.id === Number(this.opts.priorityIdOrName),
		);
		if (!foundPriority) return err(new Error("Priority not found"));
		this.priority = foundPriority;

		const statusesRes = await this.api.getProjectStatuses(this.projectId);
		if (statusesRes.isErr())
			return err(new Error("Failed to get project statuses"));
		const foundInitial = statusesRes.value.find(
			(s) =>
				s.name === this.opts.initialStatusIdOrName ||
				s.id === Number(this.opts.initialStatusIdOrName),
		);
		if (!foundInitial) return err(new Error("Initial status not found"));
		this.initialStatus = foundInitial;
		const foundCompleted = statusesRes.value.find(
			(s) =>
				s.name === this.opts.completedStatusIdOrName ||
				s.id === Number(this.opts.completedStatusIdOrName),
		);
		if (!foundCompleted) return err(new Error("Completed status not found"));
		this.completedStatus = foundCompleted;
		return ok(undefined);
	}

	/**
	 * Create a Backlog issue from a GitHub issue.
	 *
	 * @param githubIssue GitHub issue.
	 */
	public async createIssue(
		githubIssue: GithubIssue,
	): Promise<Result<string, Error>> {
		if (!this.issueType || !this.priority)
			return err(new Error("Issue type or priority not found"));
		const githubTag = makeGithubTag(
			githubIssue.number.toString(),
			githubIssue.html_url,
		);
		const payload = {
			projectId: this.projectId,
			issueTypeId: this.issueType.id,
			priorityId: this.priority.id,
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			description: `${githubTag}\n\n${githubIssue.body || ""}`,
		};
		const createdRes = await this.api.postIssue(payload);
		if (createdRes.isErr()) return err(new Error("Failed to create issue"));
		return ok(makeBacklogTag(createdRes.value.issueKey, this.opts.host));
	}

	/**
	 * Update a Backlog issue from a GitHub issue.
	 *
	 * @param githubIssue GitHub issue.
	 */
	public async updateIssue(
		githubIssue: GithubIssue,
	): Promise<Result<string | undefined, Error>> {
		if (!this.initialStatus) return err(new Error("Initial status not found"));
		const key = extractBacklogTag(githubIssue.body || "");
		if (key === null) return ok(undefined);
		const githubTag = makeGithubTag(
			githubIssue.number.toString(),
			githubIssue.html_url,
		);
		const replaced = githubIssue.body?.replace(
			/backlog\s+\[#([A-Z0-9\-_]+)\]\(.*\)/i,
			githubTag,
		);
		const payload = {
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			description: replaced || "",
			statusId: this.initialStatus.id,
		};
		const updatedRes = await this.api.patchIssue(key, payload);
		if (updatedRes.isErr()) return err(new Error("Failed to update issue"));
		return ok(makeBacklogTag(key, this.opts.host));
	}

	/**
	 * Close a Backlog issue.
	 *
	 * @param githubIssue GitHub issue.
	 */
	public async closeIssue(
		githubIssue: GithubIssue,
	): Promise<Result<string | undefined, Error>> {
		if (!this.completedStatus)
			return err(new Error("Completed status not found"));
		const key = extractBacklogTag(githubIssue.body || "");
		if (key === null) return ok(undefined);
		const payload = { statusId: this.completedStatus.id };
		const closedRes = await this.api.patchIssue(key, payload);
		if (closedRes.isErr()) return err(new Error("Failed to close issue"));
		return ok(makeBacklogTag(key, this.opts.host));
	}
}

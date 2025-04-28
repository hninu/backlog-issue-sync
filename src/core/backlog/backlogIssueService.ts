import type { Issue, Project } from "backlog-js/dist/types/entity.js";
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
	public async init(): Promise<void> {
		const projectRes = await this.api.getProject(this.opts.projectIdOrKey);
		if (projectRes.isErr()) {
			throw new Error(
				`Failed to get project (projectIdOrKey: ${this.opts.projectIdOrKey})`,
			);
		}
		this.projectId = projectRes.value.id;

		const issueTypesRes = await this.api.getIssueTypes(this.projectId);
		if (issueTypesRes.isErr()) {
			throw new Error(
				`Failed to get issue types (projectId: ${this.projectId})`,
			);
		}
		const foundType = issueTypesRes.value.find(
			(t) =>
				t.name === this.opts.issueTypeIdOrName ||
				t.id === Number(this.opts.issueTypeIdOrName),
		);
		if (!foundType) {
			throw new Error(
				`Issue type not found (issueTypeIdOrName: ${this.opts.issueTypeIdOrName})`,
			);
		}
		this.issueType = foundType;

		const prioritiesRes = await this.api.getPriorities();
		if (prioritiesRes.isErr()) {
			throw new Error(`Failed to get priorities: ${this.opts.projectIdOrKey}`);
		}
		const foundPriority = prioritiesRes.value.find(
			(p) =>
				p.name === this.opts.priorityIdOrName ||
				p.id === Number(this.opts.priorityIdOrName),
		);
		if (!foundPriority) {
			throw new Error(
				`Priority not found (priorityIdOrName: ${this.opts.priorityIdOrName})`,
			);
		}
		this.priority = foundPriority;

		const statusesRes = await this.api.getProjectStatuses(this.projectId);
		if (statusesRes.isErr()) {
			throw new Error(
				`Failed to get project statuses (projectId: ${this.projectId})`,
			);
		}
		const foundInitial = statusesRes.value.find(
			(s) =>
				s.name === this.opts.initialStatusIdOrName ||
				s.id === Number(this.opts.initialStatusIdOrName),
		);
		if (!foundInitial) {
			throw new Error(
				`Initial status not found (initialStatusIdOrName: ${this.opts.initialStatusIdOrName})`,
			);
		}
		this.initialStatus = foundInitial;

		const foundCompleted = statusesRes.value.find(
			(s) =>
				s.name === this.opts.completedStatusIdOrName ||
				s.id === Number(this.opts.completedStatusIdOrName),
		);
		if (!foundCompleted) {
			throw new Error(
				`Completed status not found (completedStatusIdOrName: ${this.opts.completedStatusIdOrName})`,
			);
		}
		this.completedStatus = foundCompleted;
	}

	/**
	 * Create a Backlog issue from a GitHub issue.
	 *
	 * @param githubIssue GitHub issue.
	 */
	public async createIssue(githubIssue: GithubIssue): Promise<string> {
		if (!this.issueType || !this.priority)
			throw new Error(
				`Issue type or priority not found (issueTypeIdOrName: ${this.opts.issueTypeIdOrName}, priorityIdOrName: ${this.opts.priorityIdOrName})`,
			);
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
		if (createdRes.isErr()) {
			throw new Error(
				`Failed to create issue (projectId: ${this.projectId}, issueTypeId: ${this.issueType.id}, priorityId: ${this.priority.id})`,
			);
		}
		return makeBacklogTag(createdRes.value.issueKey, this.opts.host);
	}

	/**
	 * Update a Backlog issue from a GitHub issue.
	 *
	 * @param githubIssue GitHub issue.
	 */
	public async updateIssue(
		githubIssue: GithubIssue,
	): Promise<string | undefined> {
		if (!this.initialStatus)
			throw new Error(
				`Initial status not found (initialStatusIdOrName: ${this.opts.initialStatusIdOrName})`,
			);
		const key = extractBacklogTag(githubIssue.body || "");
		if (key === null) return undefined;
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
		if (updatedRes.isErr()) {
			throw new Error(
				`Failed to update issue (key: ${key}, statusId: ${this.initialStatus.id})`,
			);
		}
		return makeBacklogTag(key, this.opts.host);
	}

	/**
	 * Close a Backlog issue.
	 *
	 * @param githubIssue GitHub issue.
	 */
	public async closeIssue(
		githubIssue: GithubIssue,
	): Promise<string | undefined> {
		if (!this.completedStatus)
			throw new Error(
				`Completed status not found (completedStatusIdOrName: ${this.opts.completedStatusIdOrName})`,
			);
		const key = extractBacklogTag(githubIssue.body || "");
		if (key === null) return undefined;
		const payload = { statusId: this.completedStatus.id };
		const closedRes = await this.api.patchIssue(key, payload);
		if (closedRes.isErr()) {
			throw new Error(
				`Failed to close issue (key: ${key}, statusId: ${this.completedStatus.id})`,
			);
		}
		return makeBacklogTag(key, this.opts.host);
	}
}

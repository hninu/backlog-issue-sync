import backlogjs from "backlog-js";
import type { Issue, Project } from "backlog-js/dist/types/entity.js";
import type { BacklogError } from "backlog-js/dist/types/error.js";
import { type Result, fromPromise } from "neverthrow";
import type { BacklogOptions } from "../../type.js";

/**
 * API wrapper for Backlog REST endpoints. Handles only API communication.
 */
export class BacklogApiClient {
	private backlog: backlogjs.Backlog;

	/**
	 * Initialize the API client with host and API key.
	 * @param opts Options containing host and API key.
	 */
	constructor(opts: Pick<BacklogOptions, "host" | "apiKey">) {
		this.backlog = new backlogjs.Backlog({
			host: opts.host,
			apiKey: opts.apiKey,
		});
	}

	/**
	 * Fetch project by ID or key.
	 * @param projectIdOrKey Project ID or key.
	 * @returns Project data or error.
	 */
	async getProject(
		projectIdOrKey: string,
	): Promise<Result<Project.Project, BacklogError>> {
		return fromPromise(
			this.backlog.getProject(projectIdOrKey),
			(e) => e as BacklogError,
		);
	}

	/**
	 * Fetch issue types for a project.
	 * @param projectId Project ID.
	 * @returns Issue types or error.
	 */
	async getIssueTypes(
		projectId: number,
	): Promise<Result<Issue.IssueType[], BacklogError>> {
		return fromPromise(
			this.backlog.getIssueTypes(projectId),
			(e) => e as BacklogError,
		);
	}

	/**
	 * Fetch available priorities.
	 * @returns Priorities or error.
	 */
	async getPriorities(): Promise<Result<Issue.Priority[], BacklogError>> {
		return fromPromise(this.backlog.getPriorities(), (e) => e as BacklogError);
	}

	/**
	 * Fetch project statuses.
	 * @param projectId Project ID.
	 * @returns Project statuses or error.
	 */
	async getProjectStatuses(
		projectId: number,
	): Promise<Result<Project.ProjectStatus[], BacklogError>> {
		return fromPromise(
			this.backlog.getProjectStatuses(projectId),
			(e) => e as BacklogError,
		);
	}

	/**
	 * Create a new issue.
	 * @param payload Issue creation payload.
	 * @returns Created issue or error.
	 */
	async postIssue(
		payload: backlogjs.Option.Issue.PostIssueParams,
	): Promise<Result<Issue.Issue, BacklogError>> {
		return fromPromise(
			this.backlog.postIssue(payload),
			(e) => e as BacklogError,
		);
	}

	/**
	 * Update an existing issue.
	 * @param key Issue key.
	 * @param payload Issue update payload.
	 * @returns Updated issue or error.
	 */
	async patchIssue(
		key: string,
		payload: backlogjs.Option.Issue.PatchIssueParams,
	): Promise<Result<Issue.Issue, BacklogError>> {
		return fromPromise(
			this.backlog.patchIssue(key, payload),
			(e) => e as BacklogError,
		);
	}
}

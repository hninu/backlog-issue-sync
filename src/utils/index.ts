import * as core from "@actions/core";
import type { BacklogOptions, GithubIssue } from "../type.js";

/**
 * Returns true if any of the triggerLabels is present in the issueLabels.
 * Accepts labels as string[] or { name: string }[] (GitHub API spec)
 */
export function someIncludeLabels(issueLabels: GithubIssue["labels"]): boolean {
	const input = core.getMultilineInput("include-labels");

	if (input.length === 0) return true;
	console.info(`[Labels]: ${input.join(" ")}`);

	const labels = (issueLabels || []).map((l) =>
		typeof l === "string" ? l : l.name,
	);

	return labels.some((label) => input.includes(label));
}

export function someIncludeTypes(issueType: string): boolean {
	const input = core.getMultilineInput("include-types");

	if (input.length === 0) return true;
	console.info(`[Types]: ${input.join(" ")}`);

	return input.some((type) => type === issueType);
}

export function getBacklogOptions(): BacklogOptions {
	return {
		host: core.getInput("backlog-host", { required: true }),
		apiKey: core.getInput("backlog-api-key", { required: true }),
		projectIdOrKey: core.getInput("backlog-project-key", {
			required: true,
		}),
		issueTypeIdOrName: core.getInput("backlog-issue-type", {
			required: true,
		}),
		priorityIdOrName: core.getInput("backlog-priority", {
			required: true,
		}),
		initialStatusIdOrName: core.getInput("backlog-initial-status", {
			required: true,
		}),
		completedStatusIdOrName: core.getInput("backlog-completed-status", {
			required: true,
		}),
		summaryPrefix:
			core.getInput("backlog-summary-prefix", { required: false }) || undefined,
	};
}

export function getGithubToken(): string {
	return core.getInput("github-token", { required: true });
}

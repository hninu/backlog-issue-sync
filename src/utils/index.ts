import * as core from "@actions/core";
import type { BacklogOptions } from "../type.js";

/**
 * Returns true if any of the triggerLabels is present in the issueLabels.
 * Accepts labels as string[] or { name: string }[] (GitHub API spec)
 */
export function hasAnyTriggerLabel(
	issueLabels: (string | { name: string })[] | undefined,
	triggerLabels: string[],
): boolean {
	if (!triggerLabels.length) return true;
	const labels = (issueLabels || []).map((l) =>
		typeof l === "string" ? l : l.name,
	);
	return triggerLabels.some((label) => labels.includes(label));
}

/**
 * Gets the trigger-labels input as a string array (comma separated, trimmed, empty filtered)
 */
export function getTriggerLabelsInput(): string[] {
	const input = core.getInput("trigger-labels");
	return input
		? input
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
		: [];
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

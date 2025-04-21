import * as core from "@actions/core";
import type { BacklogOptions } from "../core/backlog/index.js";

export function getBacklogOptions(): BacklogOptions {
	return {
		host: core.getInput("backlog-host", { required: true }),
		apiKey: core.getInput("backlog-api-key", { required: true }),
		projectIdOrKey: core.getInput("backlog-project-id-or-key", {
			required: true,
		}),
		issueTypeIdOrName: core.getInput("backlog-issue-type-id-or-name", {
			required: true,
		}),
		priorityIdOrName: core.getInput("backlog-priority-id-or-name", {
			required: true,
		}),
		initialStatusIdOrName: core.getInput("backlog-initial-status-id-or-name", {
			required: true,
		}),
		completedStatusIdOrName: core.getInput(
			"backlog-completed-status-id-or-name",
			{ required: true },
		),
		summaryPrefix:
			core.getInput("backlog-summary-prefix", { required: false }) || undefined,
	};
}

export function getGithubToken(): string {
	return core.getInput("github-token", { required: true });
}

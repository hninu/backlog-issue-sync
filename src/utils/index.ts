import * as core from "@actions/core";
import type { BacklogOptions } from "../type.js";

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

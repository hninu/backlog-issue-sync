import type { Issue } from "@octokit/webhooks-types";

export interface BacklogOptions {
	host: string;
	apiKey: string;
	projectIdOrKey: string;
	issueTypeIdOrName: string;
	priorityIdOrName: string;
	initialStatusIdOrName: string;
	completedStatusIdOrName: string;
	summaryPrefix?: string;
}

export type GithubIssue = Issue & {
	type: {
		color: string;
		created_at: string;
		description: string;
		id: number;
		is_enabled: true;
		name: string;
		node_id: string;
		updated_at: string;
	};
};

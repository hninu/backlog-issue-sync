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

// export type GithubIssue {
// 	id: number;
// 	number: number;
// 	title: string;
// 	html_url: string;
// 	body?: string;
// 	state: "open" | "closed";
// 	state_reason: string | null;
// 	user: { login: string };
// 	labels?: ({ name: string } | string)[];
// 	type?: string;
// }

export type GithubIssue = Issue;

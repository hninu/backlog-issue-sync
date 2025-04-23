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

export interface GithubIssue {
	id: number;
	number: number;
	title: string;
	html_url: string;
	body?: string;
	state: string;
	user: { login: string };
}

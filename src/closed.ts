import { BacklogIssueService } from "./core/backlog/index.js";
import { BacklogApiClient } from "./core/backlog/index.js";
import type { GithubIssue } from "./type.js";
import { getBacklogOptions } from "./utils/index.js";

export async function handleClosed({ issue }: { issue: GithubIssue }) {
	const opts = getBacklogOptions();
	const api = new BacklogApiClient(opts);
	const service = new BacklogIssueService(api, opts);
	await service.init();
	return await service.closeIssue(issue);
}

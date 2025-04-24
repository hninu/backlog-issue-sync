import { Backlog } from "./core/backlog/index.js";
import type { GithubIssue } from "./type.js";
import { getBacklogOptions } from "./utils/index.js";

export async function handleClosed({ issue }: { issue: GithubIssue }) {
	const opts = getBacklogOptions();

	const backlog = new Backlog(opts);
	await backlog.init();
	return await backlog.issueClose(issue);
}

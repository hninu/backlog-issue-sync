import * as core from "@actions/core";
import { Backlog } from "./core/backlog/index.js";
import type { GithubIssue } from "./type.js";
import { getBacklogOptions } from "./utils/index.js";

export async function handleReopen({ issue }: { issue: GithubIssue }) {
	const opts = getBacklogOptions();

	const backlog = new Backlog(opts);
	await backlog.init();
	await backlog.issueUpdate(issue);

	core.info("Backlog課題を更新したニャ");
}

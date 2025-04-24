import * as github from "@actions/github";
import { BacklogIssueService } from "./core/backlog/index.js";
import { BacklogApiClient } from "./core/backlog/index.js";
import type { GithubIssue } from "./type.js";
import { getBacklogOptions, getGithubToken } from "./utils/index.js";

export async function handleOpen({
	issue,
	repo,
}: {
	issue: GithubIssue;
	repo: { owner: string; repo: string };
}) {
	const opts = getBacklogOptions();
	const token = getGithubToken();

	const octokit = github.getOctokit(token);

	const api = new BacklogApiClient(opts);
	const service = new BacklogIssueService(api, opts);
	await service.init();
	const backlogTag = await service.createIssue(issue);

	const newBody = `${backlogTag}\n\n${issue.body || ""}`;
	await octokit.rest.issues.update({
		owner: repo.owner,
		repo: repo.repo,
		issue_number: issue.number,
		body: newBody,
	});

	return backlogTag;
}

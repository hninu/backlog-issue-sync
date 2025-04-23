import * as core from "@actions/core";
import * as github from "@actions/github";
import { Backlog } from "./core/backlog/index.js";
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

	const backlog = new Backlog(opts);
	await backlog.init();
	const tag = await backlog.issueCreate(issue);

	const newBody = `${issue.body || ""}\n\n${tag}`;
	await octokit.rest.issues.update({
		owner: repo.owner,
		repo: repo.repo,
		issue_number: issue.number,
		body: newBody,
	});

	core.info(`Backlog課題を新規作成し、リンクを追記したニャ: ${tag}`);
}

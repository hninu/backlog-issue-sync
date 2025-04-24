import "isomorphic-form-data";
import "isomorphic-fetch";

import * as core from "@actions/core";
import * as github from "@actions/github";

import { handleClosed } from "./closed.js";
import { extractBacklogTag } from "./core/backlog/backlogUtils.js";
import { handleEdit } from "./edit.js";
import { handleOpen } from "./open.js";
import { handleReopen } from "./reopen.js";
import type { GithubIssue } from "./type.js";

export async function run(): Promise<void> {
	try {
		const { payload, repo } = github.context;

		const issue = payload.issue as GithubIssue;
		console.info("issue: ", issue);

		if (issue.state === "open" && issue.state_reason === "reopened") {
			const tag = await handleReopen({ issue });
			return core.info(`Finished handling reopened issue: ${tag}`);
		}

		if (issue.state === "open") {
			const existBacklogTag = extractBacklogTag(issue.body || "");

			if (existBacklogTag === null) {
				const tag = await handleOpen({ issue, repo });
				return core.info(`Finished handling opened issue: ${tag}`);
			}

			const tag = await handleEdit({ issue });
			return core.info(`Finished handling edited issue: ${tag}`);
		}

		if (issue.state === "closed") {
			const tag = await handleClosed({ issue });
			return core.info(`Finished handling closed issue: ${tag}`);
		}
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
	}
}

run();

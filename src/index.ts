import "isomorphic-form-data";
import "isomorphic-fetch";

import * as core from "@actions/core";
import * as github from "@actions/github";

import { handleClosed } from "./closed.js";
import { Backlog } from "./core/backlog/index.js";
import { handleEdit } from "./edit.js";
import { handleOpen } from "./open.js";
import { handleReopen } from "./reopen.js";
import type { GithubIssue } from "./type.js";

export async function run(): Promise<void> {
	try {
		const { payload, repo } = github.context;

		const issue = payload.issue as GithubIssue;
		console.log("issue: ", issue);

		if (issue.state === "open" && issue.state_reason === "reopened") {
			return await handleReopen({ issue });
		}

		if (issue.state === "open") {
			const existBacklogTag = Backlog.extractBacklogTag(issue.body || "");

			if (existBacklogTag === null) {
				return await handleOpen({ issue, repo });
			}

			return await handleEdit({ issue });
		}

		if (issue.state === "closed") {
			return await handleClosed({ issue });
		}

		core.setFailed("このアクションはissueイベントでのみ動作するニャ");
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
	}
}

run();

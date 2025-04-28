// Main entry point for the GitHub Action
// Handles event routing and label-based filtering

import "isomorphic-fetch";

import * as core from "@actions/core";
import * as github from "@actions/github";

import { handleClosed } from "./closed.js";
import { extractBacklogTag } from "./core/backlog/backlogUtils.js";
import { handleEdit } from "./edit.js";
import { handleOpen } from "./open.js";
import { handleReopen } from "./reopen.js";
import type { GithubIssue } from "./type.js";
import { someIncludeLabels, someIncludeTypes } from "./utils/index.js";

/**
 * Main runner for the Action. Dispatches to handlers based on issue event type and label filter.
 */
export async function run(): Promise<void> {
	try {
		// Get GitHub context and issue data
		const { payload, repo } = github.context;
		const issue = payload.issue as GithubIssue;

		console.info(issue);

		if (someIncludeLabels(issue.labels) === false) {
			core.info("Skipped: none of the include-labels found on this issue.");
			return;
		}

		if (someIncludeTypes(issue.type.name) === false) {
			core.info("Skipped: none of the include-types found on this issue.");
			return;
		}

		// Handle issue reopened event
		if (issue.state === "open" && issue.state_reason === "reopened") {
			const tag = await handleReopen({ issue });
			return core.info(`Finished handling reopened issue: ${tag}`);
		}

		// Handle issue opened or edited event
		if (issue.state === "open") {
			// Check for existing Backlog tag in issue body
			const existBacklogTag = extractBacklogTag(issue.body || "");

			// If no Backlog tag, treat as newly opened
			if (existBacklogTag === null) {
				const tag = await handleOpen({ issue, repo });
				return core.info(`Finished handling opened issue: ${tag}`);
			}

			// Otherwise, treat as edited
			const tag = await handleEdit({ issue });
			return core.info(`Finished handling edited issue: ${tag}`);
		}

		// Handle issue closed event
		if (issue.state === "closed") {
			const tag = await handleClosed({ issue });
			return core.info(`Finished handling closed issue: ${tag}`);
		}
	} catch (error) {
		// Catch and handle any errors that occur during execution
		if (error instanceof Error) core.setFailed(error.message);
	}
}

// Run the main entry point
run();

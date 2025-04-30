import * as core from "@actions/core";
import * as github from "@actions/github";

import { handleClosed } from "./closed.js";
import { extractBacklogTag } from "./core/backlog/backlogUtils.js";
import { handleEdit } from "./edit.js";
import { handleOpen } from "./open.js";
import { handleReopen } from "./reopen.js";
import type { GithubIssue } from "./type.js";
import { Input } from "./utils/Input.js";
import { Validator } from "./utils/Validator.js";

/**
 * Main runner for the Action. Dispatches to handlers based on issue event type and label filter.
 */
export async function run(): Promise<void> {
  try {
    // Get GitHub context and issue data
    const { payload, repo } = github.context;
    const issue = payload.issue as GithubIssue;

    console.debug(issue);

    const input = new Input(core);
    const opts = input.getBacklogOptions();

    // --- validation ---

    const validator = new Validator(issue, opts);

    if (!validator.someIncludeLabels()) {
      return core.info(
        "Skipped: none of the include-labels found on this issue.",
      );
    }

    if (!validator.someIncludeTypes()) {
      return core.info(
        "Skipped: none of the include-types found on this issue.",
      );
    }

    // --- handle issue ---

    // Handle issue reopened event
    if (issue.state === "open" && issue.state_reason === "reopened") {
      // Check for existing Backlog tag in issue body
      const existBacklogTag = extractBacklogTag(issue.body || "");

      // If no Backlog tag, treat as newly opened
      if (existBacklogTag === null) {
        const tag = await handleOpen({ issue, repo });
        return core.info(`Finished handling opened issue: ${tag}`);
      }

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
    console.debug(error);
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

// Run the main entry point
run();

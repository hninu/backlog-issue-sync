import * as _core from "@actions/core";
import actionJson from "../../action.json" with { type: "json" };
import type { BacklogOptions } from "../type.js";

type Key = keyof typeof actionJson.inputs;

export class Input {
  constructor(private readonly core: typeof import("@actions/core") = _core) {}

  // --- PUBLIC ---

  public getBacklogOptions(): BacklogOptions {
    return {
      host: this.getInput("backlog-host", { required: true }),
      apiKey: this.getInput("backlog-api-key", { required: true }),
      projectIdOrKey: this.getInput("backlog-project-key", {
        required: true,
      }),
      issueTypeIdOrName: this.getInput("backlog-issue-type", {
        required: true,
      }),
      priorityIdOrName: this.getInput("backlog-priority", {
        required: true,
      }),
      initialStatusIdOrName: this.getInput("backlog-initial-status", {
        required: true,
      }),
      completedStatusIdOrName: this.getInput("backlog-completed-status", {
        required: true,
      }),
      backlogStartDate:
        this.getInput("backlog-start-date", { required: false }) || null,
      backlogDueDate:
        this.getInput("backlog-due-date", { required: false }) || null,
      summaryPrefix:
        this.getInput("backlog-summary-prefix", { required: false }) || null,
      includeLabels: this.getMultilineInput("include-labels"),
      includeTypes: this.getMultilineInput("include-types"),
      assigneeIdMap: this.getAssigneeIdMap(),
    };
  }

  public getAssigneeIdMap(): [string, string][] | null {
    const input = this.getMultilineInput("assignee-id-map");
    if (input.length === 0) {
      return null;
    }
    return input
      .map((line) => {
        const trimmed = line.trim().replaceAll(" ", "");
        const matches = trimmed.match(/@(\S+)/g);
        if (matches && matches.length >= 2) {
          return [matches[0].replace("@", ""), matches[1].replace("@", "")];
        }
        return null;
      })
      .filter((pair): pair is [string, string] => pair !== null);
  }

  public getGithubToken(): string {
    return this.getInput("github-token", { required: true });
  }

  public getInput(key: Key, options?: _core.InputOptions) {
    return this.core.getInput(key, options);
  }

  public getMultilineInput(key: Key, options?: _core.InputOptions) {
    return this.core.getMultilineInput(key, options);
  }
}

// src/index.ts
import "isomorphic-fetch";
import * as core from "@actions/core";
import * as github2 from "@actions/github";

// src/core/backlog/backlogUtils.ts
function extractBacklogTag(text) {
  const backlogRegex = /backlog\s+\[#([A-Z0-9\-_]+)\]\(.*\)/i;
  const match = text.match(backlogRegex);
  return match ? match[1] : null;
}
function makeBacklogTag(key, host) {
  const url = `https://${host}/view/${key}`;
  return `backlog [#${key}](${url})`;
}
function makeGithubTag(key, url) {
  return `github [#${key}](${url})`;
}

// src/core/backlog/backlogIssueService.ts
var BacklogIssueService = class {
  /**
   * Constructor.
   *
   * @param api Backlog API client.
   * @param opts Backlog options.
   */
  constructor(api, opts) {
    this.api = api;
    this.opts = opts;
  }
  /**
   * Project ID.
   */
  projectId = 0;
  /**
   * Issue type.
   */
  issueType;
  /**
   * Priority.
   */
  priority;
  /**
   * Initial status.
   */
  initialStatus;
  /**
   * Completed status.
   */
  completedStatus;
  /**
   * Initialize project, issue type, priority, and status info.
   */
  async init() {
    const projectRes = await this.api.getProject(this.opts.projectIdOrKey);
    if (projectRes.isErr()) {
      throw new Error(
        `Failed to get project (projectIdOrKey: ${this.opts.projectIdOrKey})`
      );
    }
    this.projectId = projectRes.value.id;
    const issueTypesRes = await this.api.getIssueTypes(this.projectId);
    if (issueTypesRes.isErr()) {
      throw new Error(
        `Failed to get issue types (projectId: ${this.projectId})`
      );
    }
    const foundType = issueTypesRes.value.find(
      (t) => t.name === this.opts.issueTypeIdOrName || t.id === Number(this.opts.issueTypeIdOrName)
    );
    if (!foundType) {
      throw new Error(
        `Issue type not found (issueTypeIdOrName: ${this.opts.issueTypeIdOrName})`
      );
    }
    this.issueType = foundType;
    const prioritiesRes = await this.api.getPriorities();
    if (prioritiesRes.isErr()) {
      throw new Error(`Failed to get priorities: ${this.opts.projectIdOrKey}`);
    }
    const foundPriority = prioritiesRes.value.find(
      (p) => p.name === this.opts.priorityIdOrName || p.id === Number(this.opts.priorityIdOrName)
    );
    if (!foundPriority) {
      throw new Error(
        `Priority not found (priorityIdOrName: ${this.opts.priorityIdOrName})`
      );
    }
    this.priority = foundPriority;
    const statusesRes = await this.api.getProjectStatuses(this.projectId);
    if (statusesRes.isErr()) {
      throw new Error(
        `Failed to get project statuses (projectId: ${this.projectId})`
      );
    }
    const foundInitial = statusesRes.value.find(
      (s) => s.name === this.opts.initialStatusIdOrName || s.id === Number(this.opts.initialStatusIdOrName)
    );
    if (!foundInitial) {
      throw new Error(
        `Initial status not found (initialStatusIdOrName: ${this.opts.initialStatusIdOrName})`
      );
    }
    this.initialStatus = foundInitial;
    const foundCompleted = statusesRes.value.find(
      (s) => s.name === this.opts.completedStatusIdOrName || s.id === Number(this.opts.completedStatusIdOrName)
    );
    if (!foundCompleted) {
      throw new Error(
        `Completed status not found (completedStatusIdOrName: ${this.opts.completedStatusIdOrName})`
      );
    }
    this.completedStatus = foundCompleted;
  }
  /**
   * Create a Backlog issue from a GitHub issue.
   *
   * @param githubIssue GitHub issue.
   */
  async createIssue(githubIssue) {
    if (!this.issueType || !this.priority)
      throw new Error(
        `Issue type or priority not found (issueTypeIdOrName: ${this.opts.issueTypeIdOrName}, priorityIdOrName: ${this.opts.priorityIdOrName})`
      );
    const githubTag = makeGithubTag(
      githubIssue.number.toString(),
      githubIssue.html_url
    );
    const createdRes = await this.api.postIssue({
      projectId: this.projectId,
      issueTypeId: this.issueType.id,
      priorityId: this.priority.id,
      summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
      description: `${githubTag}

${githubIssue.body || ""}`
      // startDate: this.opts.
      // dueDate:
    });
    if (createdRes.isErr()) {
      throw new Error(
        `Failed to create issue (projectId: ${this.projectId}, issueTypeId: ${this.issueType.id}, priorityId: ${this.priority.id})`
      );
    }
    return makeBacklogTag(createdRes.value.issueKey, this.opts.host);
  }
  /**
   * Update a Backlog issue from a GitHub issue.
   *
   * @param githubIssue GitHub issue.
   */
  async updateIssue(githubIssue) {
    if (!this.initialStatus)
      throw new Error(
        `Initial status not found (initialStatusIdOrName: ${this.opts.initialStatusIdOrName})`
      );
    const key = extractBacklogTag(githubIssue.body || "");
    if (key === null) return void 0;
    const githubTag = makeGithubTag(
      githubIssue.number.toString(),
      githubIssue.html_url
    );
    const replaced = githubIssue.body?.replace(
      /backlog\s+\[#([A-Z0-9\-_]+)\]\(.*\)/i,
      githubTag
    );
    const payload = {
      summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
      description: replaced || "",
      statusId: this.initialStatus.id
    };
    const updatedRes = await this.api.patchIssue(key, payload);
    if (updatedRes.isErr()) {
      throw new Error(
        `Failed to update issue (key: ${key}, statusId: ${this.initialStatus.id})`
      );
    }
    return makeBacklogTag(key, this.opts.host);
  }
  /**
   * Close a Backlog issue.
   *
   * @param githubIssue GitHub issue.
   */
  async closeIssue(githubIssue) {
    if (!this.completedStatus)
      throw new Error(
        `Completed status not found (completedStatusIdOrName: ${this.opts.completedStatusIdOrName})`
      );
    const key = extractBacklogTag(githubIssue.body || "");
    if (key === null) return void 0;
    const payload = { statusId: this.completedStatus.id };
    const closedRes = await this.api.patchIssue(key, payload);
    if (closedRes.isErr()) {
      throw new Error(
        `Failed to close issue (key: ${key}, statusId: ${this.completedStatus.id})`
      );
    }
    return makeBacklogTag(key, this.opts.host);
  }
};

// src/core/backlog/backlogApiClient.ts
import backlogjs from "backlog-js";
import { fromPromise } from "neverthrow";
var BacklogApiClient = class {
  backlog;
  /**
   * Initialize the API client with host and API key.
   * @param opts Options containing host and API key.
   */
  constructor(opts) {
    this.backlog = new backlogjs.Backlog({
      host: opts.host,
      apiKey: opts.apiKey
    });
  }
  /**
   * Fetch project by ID or key.
   * @param projectIdOrKey Project ID or key.
   * @returns Project data or error.
   */
  async getProject(projectIdOrKey) {
    return fromPromise(
      this.backlog.getProject(projectIdOrKey),
      (e) => e
    );
  }
  /**
   * Fetch issue types for a project.
   * @param projectId Project ID.
   * @returns Issue types or error.
   */
  async getIssueTypes(projectId) {
    return fromPromise(
      this.backlog.getIssueTypes(projectId),
      (e) => e
    );
  }
  /**
   * Fetch available priorities.
   * @returns Priorities or error.
   */
  async getPriorities() {
    return fromPromise(this.backlog.getPriorities(), (e) => e);
  }
  /**
   * Fetch project statuses.
   * @param projectId Project ID.
   * @returns Project statuses or error.
   */
  async getProjectStatuses(projectId) {
    return fromPromise(
      this.backlog.getProjectStatuses(projectId),
      (e) => e
    );
  }
  /**
   * Create a new issue.
   * @param payload Issue creation payload.
   * @returns Created issue or error.
   */
  async postIssue(payload) {
    return fromPromise(
      this.backlog.postIssue(payload),
      (e) => e
    );
  }
  /**
   * Update an existing issue.
   * @param key Issue key.
   * @param payload Issue update payload.
   * @returns Updated issue or error.
   */
  async patchIssue(key, payload) {
    return fromPromise(
      this.backlog.patchIssue(key, payload),
      (e) => e
    );
  }
};

// src/utils/Input.ts
import * as _core from "@actions/core";
var Input = class {
  constructor(core2 = _core) {
    this.core = core2;
  }
  // --- PUBLIC ---
  getBacklogOptions() {
    return {
      host: this.getInput("backlog-host", { required: true }),
      apiKey: this.getInput("backlog-api-key", { required: true }),
      projectIdOrKey: this.getInput("backlog-project-key", {
        required: true
      }),
      issueTypeIdOrName: this.getInput("backlog-issue-type", {
        required: true
      }),
      priorityIdOrName: this.getInput("backlog-priority", {
        required: true
      }),
      initialStatusIdOrName: this.getInput("backlog-initial-status", {
        required: true
      }),
      completedStatusIdOrName: this.getInput("backlog-completed-status", {
        required: true
      }),
      summaryPrefix: this.getInput("backlog-summary-prefix", { required: false }) || void 0,
      includeLabels: this.getMultilineInput("include-labels"),
      includeTypes: this.getMultilineInput("include-types")
    };
  }
  getAssigneeIdMap() {
    const input = this.getMultilineInput("assignee-id-map");
    if (input.length === 0) {
      return null;
    }
    return input.map((line) => {
      const trimmed = line.trim();
      const matches = trimmed.match(/@(\S+)/g);
      if (matches && matches.length >= 2) {
        return [matches[0].replace("@", ""), matches[1].replace("@", "")];
      }
      return null;
    }).filter((pair) => pair !== null);
  }
  getGithubToken() {
    return this.getInput("github-token", { required: true });
  }
  getInput(key, options) {
    return this.core.getInput(key, options);
  }
  getMultilineInput(key, options) {
    return this.core.getMultilineInput(key, options);
  }
};

// src/closed.ts
async function handleClosed({ issue }) {
  const input = new Input();
  const opts = input.getBacklogOptions();
  const api = new BacklogApiClient(opts);
  const service = new BacklogIssueService(api, opts);
  await service.init();
  return await service.closeIssue(issue);
}

// src/edit.ts
async function handleEdit({ issue }) {
  const input = new Input();
  const opts = input.getBacklogOptions();
  const api = new BacklogApiClient(opts);
  const service = new BacklogIssueService(api, opts);
  await service.init();
  return await service.updateIssue(issue);
}

// src/open.ts
import * as github from "@actions/github";
async function handleOpen({
  issue,
  repo
}) {
  const input = new Input();
  const opts = input.getBacklogOptions();
  const token = input.getGithubToken();
  const octokit = github.getOctokit(token);
  const api = new BacklogApiClient(opts);
  const service = new BacklogIssueService(api, opts);
  await service.init();
  const backlogTag = await service.createIssue(issue);
  const newBody = `${backlogTag}

${issue.body || ""}`;
  await octokit.rest.issues.update({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issue.number,
    body: newBody
  });
  return backlogTag;
}

// src/reopen.ts
async function handleReopen({ issue }) {
  const input = new Input();
  const opts = input.getBacklogOptions();
  const api = new BacklogApiClient(opts);
  const service = new BacklogIssueService(api, opts);
  await service.init();
  return await service.updateIssue(issue);
}

// src/utils/Validator.ts
var Validator = class {
  issue;
  opts;
  constructor(issue, opts) {
    this.issue = issue;
    this.opts = opts;
  }
  /**
   * 指定ラベルが含まれているか判定
   */
  someIncludeLabels() {
    const includeLabels = this.opts.includeLabels;
    if (includeLabels.length === 0) return true;
    const labels = (this.issue.labels || []).map(
      (l) => typeof l === "string" ? l : l.name
    );
    return labels.some((label) => includeLabels.includes(label));
  }
  /**
   * 指定タイプが含まれているか判定
   */
  someIncludeTypes() {
    const includeTypes = this.opts.includeTypes;
    if (includeTypes.length === 0) return true;
    return includeTypes.some((type) => type === (this.issue.type?.name || ""));
  }
};

// src/index.ts
async function run() {
  try {
    const { payload, repo } = github2.context;
    const issue = payload.issue;
    console.debug(issue);
    const input = new Input(core);
    const opts = input.getBacklogOptions();
    const validator = new Validator(issue, opts);
    if (!validator.someIncludeLabels()) {
      return core.info(
        "Skipped: none of the include-labels found on this issue."
      );
    }
    if (!validator.someIncludeTypes()) {
      return core.info(
        "Skipped: none of the include-types found on this issue."
      );
    }
    if (issue.state === "open" && issue.state_reason === "reopened") {
      const tag = await handleReopen({ issue });
      return core.info(`Finished handling reopened issue: ${tag}`);
    }
    if (issue.state === "open") {
      const existBacklogTag = extractBacklogTag(issue.body || "");
      if (existBacklogTag === null) {
        const tag2 = await handleOpen({ issue, repo });
        return core.info(`Finished handling opened issue: ${tag2}`);
      }
      const tag = await handleEdit({ issue });
      return core.info(`Finished handling edited issue: ${tag}`);
    }
    if (issue.state === "closed") {
      const tag = await handleClosed({ issue });
      return core.info(`Finished handling closed issue: ${tag}`);
    }
  } catch (error) {
    console.debug(error);
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}
run();
export {
  run
};
//# sourceMappingURL=index.js.map
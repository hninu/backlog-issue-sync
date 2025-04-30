import type { Issue, Project } from "backlog-js/dist/types/entity.js";
import type { BacklogOptions, GithubIssue } from "../../type.js";
import type { BacklogApiClient } from "./backlogApiClient.js";
import {
  extractBacklogTag,
  makeBacklogTag,
  makeGithubTag,
} from "./backlogUtils.js";

/**
 * Service for Backlog issue operations (business logic and state management).
 */
export class BacklogIssueService {
  /**
   * Project ID.
   */
  private projectId = 0;

  /**
   * Issue type.
   */
  private issueType: Issue.IssueType | undefined;

  /**
   * Priority.
   */
  private priority: Issue.Priority | undefined;

  /**
   * Initial status.
   */
  private initialStatus: Project.ProjectStatus | undefined;

  /**
   * Completed status.
   */
  private completedStatus: Project.ProjectStatus | undefined;

  /**
   * Constructor.
   *
   * @param api Backlog API client.
   * @param opts Backlog options.
   */
  constructor(
    private api: BacklogApiClient,
    private opts: BacklogOptions,
  ) {}

  /**
   * Initialize project, issue type, priority, and status info.
   */
  public async init(): Promise<void> {
    await this.initProject();
    await this.initIssueTypes();
    await this.initPriorities();
    await this.initStatuses();
  }

  // --- PUBLIC METHODS ---

  /**
   * Create a Backlog issue from a GitHub issue.
   *
   * @param githubIssue GitHub issue.
   */
  public async createIssue(githubIssue: GithubIssue): Promise<string> {
    if (!this.issueType || !this.priority)
      throw new Error(
        `Issue type or priority not found (issueTypeIdOrName: ${this.opts.issueTypeIdOrName}, priorityIdOrName: ${this.opts.priorityIdOrName})`,
      );

    const githubTag = makeGithubTag(
      githubIssue.number.toString(),
      githubIssue.html_url,
    );

    const assigneeId = await this.getAssigneeId(githubIssue.user.login);

    const createdRes = await this.api.postIssue({
      projectId: this.projectId,
      issueTypeId: this.issueType.id,
      priorityId: this.priority.id,
      summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
      description: `${githubTag}\n\n${githubIssue.body || ""}`,
      assigneeId: assigneeId,
      startDate: this.opts.backlogStartDate
        ? new Date(this.opts.backlogStartDate).toISOString()
        : undefined,
      dueDate: this.opts.backlogDueDate
        ? new Date(this.opts.backlogDueDate).toISOString()
        : undefined,
    });

    if (createdRes.isErr()) {
      throw new Error(
        `Failed to create issue (projectId: ${this.projectId}, issueTypeId: ${this.issueType.id}, priorityId: ${this.priority.id})`,
      );
    }
    return makeBacklogTag(createdRes.value.issueKey, this.opts.host);
  }

  /**
   * Update a Backlog issue from a GitHub issue.
   *
   * @param githubIssue GitHub issue.
   */
  public async updateIssue(
    githubIssue: GithubIssue,
  ): Promise<string | undefined> {
    if (!this.initialStatus)
      throw new Error(
        `Initial status not found (initialStatusIdOrName: ${this.opts.initialStatusIdOrName})`,
      );
    const key = extractBacklogTag(githubIssue.body || "");

    if (key === null) return undefined;

    const githubTag = makeGithubTag(
      githubIssue.number.toString(),
      githubIssue.html_url,
    );

    const replaced = githubIssue.body?.replace(
      /backlog\s+\[#([A-Z0-9\-_]+)\]\(.*\)/i,
      githubTag,
    );

    const assigneeId = await this.getAssigneeId(githubIssue.user.login);

    const updatedRes = await this.api.patchIssue(key, {
      summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
      description: replaced || "",
      statusId: this.initialStatus.id,
      assigneeId: assigneeId,
    });

    if (updatedRes.isErr()) {
      throw new Error(
        `Failed to update issue (key: ${key}, statusId: ${this.initialStatus.id})`,
      );
    }
    return makeBacklogTag(key, this.opts.host);
  }

  /**
   * Close a Backlog issue.
   *
   * @param githubIssue GitHub issue.
   */
  public async closeIssue(
    githubIssue: GithubIssue,
  ): Promise<string | undefined> {
    if (!this.completedStatus)
      throw new Error(
        `Completed status not found (completedStatusIdOrName: ${this.opts.completedStatusIdOrName})`,
      );
    const key = extractBacklogTag(githubIssue.body || "");
    if (key === null) return undefined;
    const payload = { statusId: this.completedStatus.id };
    const closedRes = await this.api.patchIssue(key, payload);
    if (closedRes.isErr()) {
      throw new Error(
        `Failed to close issue (key: ${key}, statusId: ${this.completedStatus.id})`,
      );
    }
    return makeBacklogTag(key, this.opts.host);
  }

  // --- PRIVATE METHODS ---

  /**
   * Fetch and set project information
   */
  private async initProject(): Promise<void> {
    const res = await this.api.getProject(this.opts.projectIdOrKey);

    if (res.isErr()) {
      throw new Error(
        `Failed to get project (projectIdOrKey: ${this.opts.projectIdOrKey})`,
      );
    }

    this.projectId = res.value.id;
  }

  /**
   * Fetch and set issue types
   */
  private async initIssueTypes(): Promise<void> {
    if (!this.projectId) {
      throw new Error("Project not initialized");
    }
    const res = await this.api.getIssueTypes(this.projectId);
    if (res.isErr()) {
      throw new Error(
        `Failed to get issue types (projectId: ${this.projectId})`,
      );
    }

    const foundType = res.value.find(
      (t) =>
        t.name === this.opts.issueTypeIdOrName ||
        t.id === Number(this.opts.issueTypeIdOrName),
    );
    if (!foundType) {
      throw new Error(`Issue type not found: ${this.opts.issueTypeIdOrName}`);
    }

    this.issueType = foundType;
  }

  /**
   * Fetch and set priorities
   */
  private async initPriorities(): Promise<void> {
    const res = await this.api.getPriorities();
    if (res.isErr()) {
      throw new Error("Failed to get priorities");
    }

    const foundPriority = res.value.find(
      (p) =>
        p.name === this.opts.priorityIdOrName ||
        p.id === Number(this.opts.priorityIdOrName),
    );

    if (!foundPriority) {
      throw new Error(`Priority not found: ${this.opts.priorityIdOrName}`);
    }
    this.priority = foundPriority;
  }

  /**
   * Fetch and set statuses
   */
  private async initStatuses(): Promise<void> {
    if (!this.projectId) {
      throw new Error("Project not initialized");
    }
    const res = await this.api.getProjectStatuses(this.projectId);
    if (res.isErr()) {
      throw new Error(
        `Failed to get project statuses (projectId: ${this.projectId})`,
      );
    }
    const foundInitial = res.value.find(
      (s) =>
        s.name === this.opts.initialStatusIdOrName ||
        s.id === Number(this.opts.initialStatusIdOrName),
    );
    if (!foundInitial) {
      throw new Error(
        `Initial status not found: ${this.opts.initialStatusIdOrName}`,
      );
    }
    this.initialStatus = foundInitial;

    const foundCompleted = res.value.find(
      (s) =>
        s.name === this.opts.completedStatusIdOrName ||
        s.id === Number(this.opts.completedStatusIdOrName),
    );
    if (!foundCompleted) {
      throw new Error(
        `Completed status not found: ${this.opts.completedStatusIdOrName}`,
      );
    }
    this.completedStatus = foundCompleted;
  }

  private async getAssigneeId(githubId: string): Promise<number | undefined> {
    if (this.opts.assigneeIdMap === null) return undefined;

    const backlogId = this.opts.assigneeIdMap
      .find((pair) => pair[0] === githubId)
      ?.at(1);

    if (backlogId === undefined) {
      throw new Error(`Assignee not found (githubId: ${githubId})`);
    }

    const users = await this.api.getUsers();

    if (users.isErr()) {
      throw new Error("Failed to get users");
    }

    return users.value.find((user) => user.userId === backlogId)?.id;
  }
}

import backlogjs from "backlog-js";
import { fromPromise } from "neverthrow";
import type { BacklogOptions, GithubIssue } from "../../type.js";

export class Backlog {
	private backlog: backlogjs.Backlog;
	private projectId = 0;
	private issueType: backlogjs.Entity.Issue.IssueType | undefined;
	private priority: backlogjs.Entity.Issue.Priority | undefined;

	constructor(private opts: BacklogOptions) {
		this.backlog = new backlogjs.Backlog({
			host: opts.host,
			apiKey: opts.apiKey,
		});
	}

	async init(): Promise<void> {
		const project = await this.backlog.getProject(this.opts.projectIdOrKey);
		this.projectId = project.id;

		const issueTypes = await fromPromise(
			this.backlog.getIssueTypes(this.projectId),
			(e) => e as Error,
		);

		if (issueTypes.isErr()) {
			throw new Error(`getIssueTypes failed: ${this.opts.issueTypeIdOrName}`);
		}

		const foundType = issueTypes.value.find(
			(t) =>
				t.name === this.opts.issueTypeIdOrName ||
				t.id === Number(this.opts.issueTypeIdOrName),
		);

		if (foundType === undefined)
			throw new Error(`issueType not found: ${this.opts.issueTypeIdOrName}`);

		this.issueType = foundType;

		const priorities = await fromPromise(
			this.backlog.getPriorities(),
			(e) => e as Error,
		);

		if (priorities.isErr()) {
			throw new Error(`getPriorities failed: ${this.opts.priorityIdOrName}`);
		}

		const foundPriority = priorities.value.find(
			(p) =>
				p.name === this.opts.priorityIdOrName ||
				p.id === Number(this.opts.priorityIdOrName),
		);

		if (foundPriority === undefined)
			throw new Error(`priority not found: ${this.opts.priorityIdOrName}`);

		this.priority = foundPriority;
	}

	/**
	 * Backlog課題作成。作成後、Backlog課題キーを返すニャ。
	 */
	public async issueCreate(githubIssue: GithubIssue): Promise<string> {
		if (!this.issueType || !this.priority) {
			throw new Error("issueType or priority not found");
		}

		const initialStatus = await fromPromise(
			this.backlog.getProjectStatuses(this.projectId),
			(e) => e as Error,
		);

		if (initialStatus.isErr()) {
			throw new Error(
				`getProjectStatuses failed: ${this.opts.initialStatusIdOrName}`,
			);
		}

		const foundInitialStatus = initialStatus.value.find(
			(s) =>
				s.name === this.opts.initialStatusIdOrName ||
				s.id === Number(this.opts.initialStatusIdOrName),
		);

		if (foundInitialStatus === undefined)
			throw new Error(
				`initialStatus not found: ${this.opts.initialStatusIdOrName}`,
			);

		const githubTag = Backlog.makeGithubTag(
			githubIssue.number.toString(),
			githubIssue.html_url,
		);

		const created = await this.backlog.postIssue({
			projectId: this.projectId,
			issueTypeId: this.issueType.id,
			priorityId: this.priority.id,
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			statusId: foundInitialStatus.id,
			description: `${githubTag}\n\n${githubIssue.body || ""}`,
		});

		const tag = Backlog.makeBacklogTag(created.issueKey, this.opts.host);

		return tag;
	}

	public async issueUpdate(githubIssue: GithubIssue) {
		const key = Backlog.extractBacklogTag(githubIssue.body);
		return this.backlog.patchIssue(key, {
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			description: `${Backlog.makeGithubTag(
				githubIssue.number.toString(),
				githubIssue.html_url,
			)}\n\n${githubIssue.body || ""}`,
		});
	}

	public async issueClose(githubIssue: GithubIssue) {
		const key = Backlog.extractBacklogTag(githubIssue.body);

		const completedStatus = await fromPromise(
			this.backlog.getProjectStatuses(this.projectId),
			(e) => e as Error,
		);

		if (completedStatus.isErr()) {
			throw new Error(
				`getProjectStatuses failed: ${this.opts.completedStatusIdOrName}`,
			);
		}

		const foundCompletedStatus = completedStatus.value.find(
			(s) =>
				s.name === this.opts.completedStatusIdOrName ||
				s.id === Number(this.opts.completedStatusIdOrName),
		);

		if (foundCompletedStatus === undefined)
			throw new Error(
				`completedStatus not found: ${this.opts.completedStatusIdOrName}`,
			);

		return this.backlog.patchIssue(key, {
			statusId: foundCompletedStatus.id,
		});
	}

	/**
	 * GitHub issue本文から `backlog #KEY` を抽出するニャ。
	 */
	public static extractBacklogTag(body?: string): string {
		if (!body) {
			throw new Error("body is required");
		}
		const match = body.match(/backlog\s+#([A-Z0-9\-_]+)/i);

		if (!match) {
			throw new Error("backlog tag not found");
		}

		return match[1];
	}

	/**
	 * backlog #KEY 文字列をMarkdownリンクで生成するニャ。
	 */
	public static makeBacklogTag(key: string, host: string): string {
		const url = `${host.replace(/\/$/, "")}/view/${key}`;
		return `backlog [#${key}](${url})`;
	}

	public static makeGithubTag(key: string, url: string): string {
		return `github [#${key}](${url})`;
	}
}

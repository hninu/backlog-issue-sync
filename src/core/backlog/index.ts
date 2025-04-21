import backlogjs from "backlog-js";

export interface BacklogOptions {
	host: string;
	apiKey: string;
	projectIdOrKey: string;
	issueTypeIdOrName: string;
	priorityIdOrName: string;
	initialStatusIdOrName: string;
	completedStatusIdOrName: string;
	summaryPrefix?: string;
}

export interface GithubIssue {
	id: number;
	number: number;
	title: string;
	html_url: string;
	body?: string;
	state: string;
	user: { login: string };
}

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

		const issueTypes = await this.backlog.getIssueTypes(this.projectId);
		const foundType = issueTypes.find(
			(t) =>
				t.name === this.opts.issueTypeIdOrName ||
				t.id === Number(this.opts.issueTypeIdOrName),
		);

		if (foundType === undefined)
			throw new Error(`issueType not found: ${this.opts.issueTypeIdOrName}`);

		this.issueType = foundType;

		const priorities = await this.backlog.getPriorities();
		const foundPriority = priorities.find(
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

		const initialStatus = await this.backlog.getProjectStatuses(this.projectId);
		const foundInitialStatus = initialStatus.find(
			(s) =>
				s.name === this.opts.initialStatusIdOrName ||
				s.id === Number(this.opts.initialStatusIdOrName),
		);

		if (foundInitialStatus === undefined)
			throw new Error(
				`initialStatus not found: ${this.opts.initialStatusIdOrName}`,
			);

		const created = await this.backlog.postIssue({
			projectId: this.projectId,
			issueTypeId: this.issueType.id,
			priorityId: this.priority.id,
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			statusId: foundInitialStatus.id,
			description: `${githubIssue.html_url}\n\n${githubIssue.body || ""}`,
		});

		const tag = Backlog.makeBacklogTag(created.issueKey, this.opts.host);

		return tag;
	}

	public async issueUpdate(githubIssue: GithubIssue) {
		const key = Backlog.extractBacklogTag(githubIssue.body);
		return this.backlog.patchIssue(key, {
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			description: `${githubIssue.html_url}\n\n${githubIssue.body || ""}`,
		});
	}

	public async issueClose(githubIssue: GithubIssue) {
		const key = Backlog.extractBacklogTag(githubIssue.body);

		const completedStatus = await this.backlog.getProjectStatuses(
			this.projectId,
		);

		const foundCompletedStatus = completedStatus.find(
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
}

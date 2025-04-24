import backlogjs from "backlog-js";
import type { BacklogError } from "backlog-js/dist/types/error.js";
import { fromPromise } from "neverthrow";
import type { BacklogOptions, GithubIssue } from "../../type.js";

export class Backlog {
	private backlog: backlogjs.Backlog;
	private projectId = 0;
	private issueType: backlogjs.Entity.Issue.IssueType | undefined;
	private priority: backlogjs.Entity.Issue.Priority | undefined;
	private initialStatus: backlogjs.Entity.Project.ProjectStatus | undefined;
	private completedStatus: backlogjs.Entity.Project.ProjectStatus | undefined;

	static readonly backlogRegex = /backlog\s+\[#([A-Z0-9\-_]+)\]\(.*\)/i;
	static readonly githubRegex =
		/github\s+\[#(\d+)\]\(https:\/\/github.com\/\w+\/\w+\/issues\/\d+\)/i;

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
			(e) => e as BacklogError,
		);

		if (issueTypes.isErr()) {
			console.debug(issueTypes.error, {
				projectId: this.projectId,
				issueTypeIdOrName: this.opts.issueTypeIdOrName,
			});
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
			(e) => e as BacklogError,
		);

		if (priorities.isErr()) {
			console.debug(priorities.error, {
				projectId: this.projectId,
			});
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

		const initialStatus = await fromPromise(
			this.backlog.getProjectStatuses(this.projectId),
			(e) => e as BacklogError,
		);

		if (initialStatus.isErr()) {
			console.debug(initialStatus.error, {
				projectId: this.projectId,
				initialStatusIdOrName: this.opts.initialStatusIdOrName,
			});
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

		const completedStatus = await fromPromise(
			this.backlog.getProjectStatuses(this.projectId),
			(e) => e as BacklogError,
		);

		if (completedStatus.isErr()) {
			console.debug(completedStatus.error, {
				projectId: this.projectId,
				completedStatusIdOrName: this.opts.completedStatusIdOrName,
			});
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

		this.initialStatus = foundInitialStatus;
		this.completedStatus = foundCompletedStatus;
	}

	/**
	 * Backlog課題作成。作成後、Backlog課題キーを返すニャ。
	 */
	public async issueCreate(githubIssue: GithubIssue): Promise<string> {
		if (!this.issueType || !this.priority) {
			throw new Error("issueType or priority not found");
		}

		const githubTag = Backlog.makeGithubTag(
			githubIssue.number.toString(),
			githubIssue.html_url,
		);

		const payload: backlogjs.Option.Issue.PostIssueParams = {
			projectId: this.projectId,
			issueTypeId: this.issueType.id,
			priorityId: this.priority.id,
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			description: `${githubTag}\n\n${githubIssue.body || ""}`,
		};

		const created = await fromPromise(
			this.backlog.postIssue(payload),
			(e) => e as BacklogError,
		);

		if (created.isErr()) {
			console.debug(created.error, payload);
			throw new Error(`postIssue failed: ${githubIssue.title}`);
		}

		return Backlog.makeBacklogTag(created.value.issueKey, this.opts.host);
	}

	public async issueUpdate(githubIssue: GithubIssue) {
		if (!this.initialStatus) {
			throw new Error("initialStatus not found");
		}

		const key = Backlog.extractBacklogTag(githubIssue.body || "");
		if (key === null) return;

		const githubTag = Backlog.makeGithubTag(
			githubIssue.number.toString(),
			githubIssue.html_url,
		);

		const replaced = githubIssue.body?.replace(Backlog.backlogRegex, githubTag);

		const payload: backlogjs.Option.Issue.PatchIssueParams = {
			summary: `${this.opts.summaryPrefix || ""}${githubIssue.title}`,
			description: replaced || "",
			statusId: this.initialStatus.id,
		};

		const updated = await fromPromise(
			this.backlog.patchIssue(key, payload),
			(e) => e as BacklogError,
		);

		if (updated.isErr()) {
			console.debug(updated.error, payload);
			throw new Error(`patchIssue failed: ${githubIssue.title}`);
		}

		return Backlog.makeBacklogTag(key, this.opts.host);
	}

	public async issueClose(githubIssue: GithubIssue) {
		if (!this.completedStatus) {
			throw new Error("completedStatus not found");
		}

		const key = Backlog.extractBacklogTag(githubIssue.body || "");
		if (key === null) return;

		const payload: backlogjs.Option.Issue.PatchIssueParams = {
			statusId: this.completedStatus.id,
		};

		const updated = await fromPromise(
			this.backlog.patchIssue(key, payload),
			(e) => e as BacklogError,
		);

		if (updated.isErr()) {
			console.debug(updated.error, key, payload);
			throw new Error(`patchIssue failed: ${githubIssue.title}`);
		}

		return Backlog.makeBacklogTag(key, this.opts.host);
	}

	/**
	 * GitHub issue本文から `backlog #KEY` を抽出するニャ。
	 */
	public static extractBacklogTag(text: string): string | null {
		const match = text.match(Backlog.backlogRegex);
		return match ? match[1] : null;
	}

	/**
	 * backlog #KEY 文字列をMarkdownリンクで生成するニャ。
	 */
	public static makeBacklogTag(key: string, host: string): string {
		const url = `https://${host}/view/${key}`;
		return `backlog [#${key}](${url})`;
	}

	public static makeGithubTag(key: string, url: string): string {
		return `github [#${key}](${url})`;
	}
}

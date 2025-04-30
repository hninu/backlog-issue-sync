import type { GithubIssue } from "../type.js";
import type { BacklogOptions } from "../type.js";

export class Validator {
  private issue: GithubIssue;
  private opts: BacklogOptions;

  constructor(issue: GithubIssue, opts: BacklogOptions) {
    this.issue = issue;
    this.opts = opts;
  }

  /**
   * 指定ラベルが含まれているか判定
   */
  someIncludeLabels(): boolean {
    const includeLabels = this.opts.includeLabels;
    if (includeLabels.length === 0) return true;

    const labels = (this.issue.labels || []).map((l) =>
      typeof l === "string" ? l : l.name,
    );

    return labels.some((label) => includeLabels.includes(label));
  }

  /**
   * 指定タイプが含まれているか判定
   */
  someIncludeTypes(): boolean {
    const includeTypes = this.opts.includeTypes;

    if (includeTypes.length === 0) return true;

    return includeTypes.some((type) => type === (this.issue.type?.name || ""));
  }
}

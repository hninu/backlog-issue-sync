import * as core from "@actions/core";
import * as github from "@actions/github";

/**
 * issueの情報を取得してログ出力するメイン関数ニャ。
 */
export async function run(): Promise<void> {
	try {
		// GitHub Actionsのコンテキストからissue情報を取得ニャ
		const context = github.context;
		const payload = context.payload;

		if (!payload.issue) {
			core.setFailed("このアクションはissueイベントでのみ動作するニャ");
			return;
		}

		const issue = payload.issue;

		core.debug(`issue: ${issue}`);
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message);
	}
}

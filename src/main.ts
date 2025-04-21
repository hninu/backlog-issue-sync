import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * issueの情報を取得してログ出力するメイン関数ニャ。
 */
export async function run(): Promise<void> {
  try {
    // GitHub Actionsのコンテキストからissue情報を取得ニャ
    const context = github.context
    const payload = context.payload

    if (!payload.issue) {
      core.setFailed('このアクションはissueイベントでのみ動作するニャ')
      return
    }

    const issue = payload.issue
    // issueのタイトル・番号・状態などを出力ニャ
    core.info(`issue番号: ${issue.number}`)
    core.info(`タイトル: ${issue.title}`)
    core.info(`状態: ${issue.state}`)
    core.info(`作成者: ${issue.user?.login}`)
    core.info(`URL: ${issue.html_url}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

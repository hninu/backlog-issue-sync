# backlog-issue-sync

![CI](https://github.com/hninu/backlog-issue-sync/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/hninu/backlog-issue-sync/actions/workflows/check-dist.yml/badge.svg)](https://github.com/hninu/backlog-issue-sync/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/hninu/backlog-issue-sync/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/hninu/backlog-issue-sync/actions/workflows/codeql-analysis.yml)

## 概要

GitHub IssuesとBacklog課題を自動で同期するGitHub Actionsニャ。
Issueの作成・編集・クローズ・再オープン時にBacklog課題も連動して操作できるニャ。

## 主な機能

- GitHub Issueの作成時にBacklog課題を自動作成
- Issue本文にBacklog課題へのリンクを自動挿入
- Issue編集時にBacklog課題も更新
- Issueクローズ/再オープン時にBacklog課題も連動して状態変更

## セットアップ

### 前提

- Node.js v20以上
- `pnpm` 推奨

### インストール

```sh
pnpm install
```

## 使い方

> **注意:**
> このActionはIssue本文にBacklogタグを追記・編集するため、
> ワークフローYAMLの `permissions` で `issues: write` を明示的に指定する必要があるニャ。

`.github/workflows/` にワークフローファイルを作成し、以下のように設定するニャ。

```yaml
name: Backlog Issue Sync

on:
  issues:
    types: [opened, edited, closed, reopened]

permissions:
  issues: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hninu/backlog-issue-sync@v1
        with:
          backlog-host: ${{ secrets.BACKLOG_HOST }}
          backlog-api-key: ${{ secrets.BACKLOG_API_KEY }}
          backlog-project-key: ${{ secrets.BACKLOG_PROJECT_KEY }}
          backlog-issue-type: "課題"
          backlog-priority: "中"
          backlog-initial-status: "未対応"
          backlog-completed-status: "完了"
          backlog-summary-prefix: "課題 | "
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## 入力パラメータ・Secrets

| 名前                       | 必須 | 説明                                                                                   | デフォルト値 |
|----------------------------|------|----------------------------------------------------------------------------------------|--------------|
| `backlog-host`             | ◯    | Backlogホスト名（例: xxxxx.backlog.jp）                                                | なし         |
| `backlog-api-key`          | ◯    | Backlog APIキー                                                                        | なし         |
| `backlog-project-key`      | ◯    | BacklogプロジェクトIDまたはキー                                                        | なし         |
| `backlog-issue-type`       | ◯    | Backlog課題タイプIDまたは名前                                                          | なし         |
| `backlog-priority`         | ◯    | Backlog優先度IDまたは名前                                                              | なし         |
| `backlog-initial-status`   | ◯    | Backlog新規課題作成時の初期ステータスIDまたは名前                                      | なし         |
| `backlog-completed-status` | ◯    | Backlog課題クローズ時に設定する完了ステータスIDまたは名前                              | なし         |
| `backlog-summary-prefix`   | -    | Backlog課題サマリーの先頭に付与する任意のプレフィックス                                | なし         |
| `github-token`             | ◯    | GitHubトークン（例: `${{ secrets.GITHUB_TOKEN }}`）                                    | なし         |

## ライセンス

MIT

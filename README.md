# backlog-issue-sync

![CI](https://github.com/hninu/backlog-issue-sync/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/hninu/backlog-issue-sync/actions/workflows/check-dist.yml/badge.svg)](https://github.com/hninu/backlog-issue-sync/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/hninu/backlog-issue-sync/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/hninu/backlog-issue-sync/actions/workflows/codeql-analysis.yml)

> 日本語README [docs/JP.md](docs/JP.md).

## Overview

A GitHub Action to automatically synchronize GitHub Issues with Backlog issues.
When you create, edit, close, or reopen a GitHub Issue, the corresponding Backlog issue is also updated accordingly.

## Features

- Automatically create a Backlog issue when a GitHub Issue is opened
- Insert a Backlog issue link into the GitHub Issue body
- Update the Backlog issue when the GitHub Issue is edited
- Change Backlog issue status when the GitHub Issue is closed or reopened

## Usage

> **Note:**
> This Action edits the GitHub Issue body to add a Backlog tag/link.
> You must explicitly set `permissions: issues: write` in your workflow YAML.

Create a workflow file in `.github/workflows/` like below:

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
          backlog-issue-type: "Task"
          backlog-priority: "Normal"
          backlog-initial-status: "Open"
          backlog-completed-status: "Closed"
          backlog-summary-prefix: "Task | "
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs / Secrets

| Name                      | Required | Description                                                           | Default |
|---------------------------|----------|-----------------------------------------------------------------------|---------|
| `backlog-host`            | Yes      | Backlog host name (e.g. xxxxx.backlog.jp)                             | None    |
| `backlog-api-key`         | Yes      | Backlog API key                                                       | None    |
| `backlog-project-key`     | Yes      | Backlog project ID or key                                             | None    |
| `backlog-issue-type`      | Yes      | Backlog issue type ID or name                                         | None    |
| `backlog-priority`        | Yes      | Backlog priority ID or name                                           | None    |
| `backlog-initial-status`  | Yes      | Status ID or name for new Backlog issues                              | None    |
| `backlog-completed-status`| Yes      | Status ID or name for completed Backlog issues                        | None    |
| `backlog-summary-prefix`  | -        | Optional prefix for Backlog issue summary                             | None    |
| `github-token`            | Yes      | GitHub token (e.g. `${{ secrets.GITHUB_TOKEN }}`)                     | None    |

## Setup

### Prerequisites

- Node.js v20 or later
- `pnpm` recommended

### Installation

```sh
pnpm install
```

## License

MIT

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
          github-token: ${{ secrets.GITHUB_TOKEN }}
          backlog-host: ${{ secrets.BACKLOG_HOST }}
          backlog-api-key: ${{ secrets.BACKLOG_API_KEY }}
          backlog-project-key: ${{ secrets.BACKLOG_PROJECT_KEY }}
          backlog-issue-type: "Task"
          backlog-priority: "Normal"
          backlog-initial-status: "Open"
          backlog-completed-status: "Closed"
          backlog-summary-prefix: "Task | "
          backlog-start-date: "today"
          backlog-due-date: "today"
          include-labels: |
            ui
            api
          include-types: |
            Bug
            Task
          assigneeIdMap: |
            @github-user-id = @backlog-user-name
            @github-user-id = @backlog-user-name
```

## Inputs / Secrets

| Name                      | Required | Description                                                                              | Default |
|---------------------------|----------|------------------------------------------------------------------------------------------|---------|
| `github-token`            | Yes      | GitHub token (e.g. `${{ secrets.GITHUB_TOKEN }}`)                                        | None    |
| `backlog-host`            | Yes      | Backlog host name (e.g. xxxxx.backlog.jp)                                                | None    |
| `backlog-api-key`         | Yes      | Backlog API key                                                                          | None    |
| `backlog-project-key`     | Yes      | Backlog project ID or key                                                                | None    |
| `backlog-issue-type`      | Yes      | Backlog issue type ID or name                                                            | None    |
| `backlog-priority`        | Yes      | Backlog priority ID or name                                                              | None    |
| `backlog-initial-status`  | Yes      | Status ID or name for new Backlog issues                                                 | None    |
| `backlog-completed-status`| Yes      | Status ID or name for completed Backlog issues                                           | None    |
| `backlog-summary-prefix`  | -        | Optional prefix for Backlog issue summary                                                | None    |
| `backlog-start-date`      | -        | Optional date for backlog start date. If set to 'today', uses today's date.              | None    |
| `backlog-due-date`        | -        | Optional date for backlog due date. If set to 'today', uses today's date.                | None    |
| `include-labels`          | -        | Comma-separated label names: Action runs if any of these labels are present on the issue | None    |
| `include-types`           | -        | Filter GitHub issues by type (e.g. Bug, Task)                                            | None    |
| `assigneeIdMap`           | -        | Mapping between GitHub ID and Backlog user ID or names for assignee                      | None    |

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

---

## Contribution

### Root Directory

| Name                | Description                                              |
|---------------------|---------------------------------------------------------|
| `README.md`         | English documentation (you are reading this file)        |
| `docs/JP.md`        | Japanese documentation                                   |
| `action.yml`        | Action metadata (inputs, outputs, main entrypoint, etc.) |
| `package.json`      | Project dependencies and scripts                         |
| `pnpm-lock.yaml`    | Lock file for pnpm                                       |
| `LICENSE`           | License file (MIT)                                       |
| `biome.json`        | Biome linter/formatter configuration                     |
| `lefthook.yml`      | Lefthook git hook config                                 |
| `.node-version`     | Node.js version file                                     |
| `.tool-versions`    | Tool version manager file                                |
| `.gitignore`        | Git ignore rules                                         |
| `.gitattributes`    | Git attributes config                                    |
| `.licensed.yml`     | Licensed dependency checker config                       |
| `rollup.config.ts`  | Rollup bundler config                                    |
| `vitest.config.ts`  | Vitest test runner config                                |

### Main Source Code

| Path                  | Description                       |
|-----------------------|-----------------------------------|
| `src/`                | Main source code (TypeScript)     |
| `src/index.ts`        | Entrypoint for the Action         |
| `src/closed.ts`       | Handler for issue closed event    |
| `src/open.ts`         | Handler for issue opened event    |
| `src/reopen.ts`       | Handler for issue reopened event  |
| `src/edit.ts`         | Handler for issue edited event    |
| `src/type.ts`         | Type definitions                  |
| `src/core/`           | Core logic and service modules    |
| `src/core/backlog/`   | Backlog API integration & logic   |
| `src/core/backlog/backlogApiClient.ts` | Backlog API client class         |
| `src/core/backlog/backlogIssueService.ts` | Backlog issue service logic   |
| `src/core/backlog/backlogUtils.ts` | Utility functions for Backlog      |
| `src/core/backlog/index.test.ts` | Tests for Backlog integration        |
| `src/core/backlog/backlog.fixtures.ts` | Test fixtures for Backlog      |
| `src/core/backlog/index.ts` | Backlog core index file                  |
| `src/utils/`          | Utility modules                    |
| `src/utils/index.ts`  | Utility functions                  |

### Distribution & Build

| Path         | Description                          |
|--------------|--------------------------------------|
| `dist/`      | Compiled JavaScript for Action       |
| `dist/index.js` | Main compiled output              |
| `dist/index.js.map` | Source map for debugging      |

### Configuration & Tooling

| Path            | Description                           |
|-----------------|---------------------------------------|
| `.github/`      | GitHub configuration directory         |
| `.github/workflows/` | CI/CD workflow YAML files        |
| `.github/dependabot.yml` | Dependabot config            |
| `.devcontainer/` | Dev Container config (if present)     |
| `.vscode/`      | VSCode editor settings                 |
| `.vscode/launch.json` | Debugger config                |
| `.vscode/settings.json` | VSCode settings               |
| `badges/`       | Coverage and status badge images       |

### Scripts & Automation

| Path         | Description                          |
|--------------|--------------------------------------|
| `script/`    | Project automation scripts           |
| `script/release` | Release tag helper script        |

### Dependency License Management

| Path           | Description                        |
|----------------|------------------------------------|
| `.licenses/`   | License cache for dependencies     |
| `.licenses/npm/` | License files for npm packages   |

### Miscellaneous

| Path              | Description                     |
|-------------------|---------------------------------|
| `coverage/`       | Test coverage output            |
| `node_modules/`   | Installed dependencies          |

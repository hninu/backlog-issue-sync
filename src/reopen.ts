import { BacklogIssueService } from "./core/backlog/index.js";
import { BacklogApiClient } from "./core/backlog/index.js";
import type { GithubIssue } from "./type.js";
import { Input } from "./utils/Input.js";

export async function handleReopen({ issue }: { issue: GithubIssue }) {
  const input = new Input();
  const opts = input.getBacklogOptions();
  const api = new BacklogApiClient(opts);
  const service = new BacklogIssueService(api, opts);
  await service.init();
  return await service.updateIssue(issue);
}

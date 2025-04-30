import type { Issue } from "@octokit/webhooks-types";

export type BacklogOptions = {
  host: string;
  apiKey: string;
  projectIdOrKey: string;
  issueTypeIdOrName: string;
  priorityIdOrName: string;
  initialStatusIdOrName: string;
  completedStatusIdOrName: string;
  backlogStartDate: string | null;
  backlogDueDate: string | null;
  summaryPrefix: string | null;
  includeLabels: string[];
  includeTypes: string[];
  assigneeIdMap: [string, string][] | null;
};

export type GithubIssue = Issue & {
  type?: {
    color: string;
    created_at: string;
    description: string;
    id: number;
    is_enabled: true;
    name: string;
    node_id: string;
    updated_at: string;
  };
};

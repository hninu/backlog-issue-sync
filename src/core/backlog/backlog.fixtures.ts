import type { Backlog as BacklogType } from "backlog-js";
import type { Issue, Project } from "backlog-js/dist/types/entity.js";
import { vi } from "vitest";

export const getProject = vi
  .fn<BacklogType["getProject"]>()
  .mockResolvedValue({ id: 1 } as Project.Project);

export const getIssueTypes = vi
  .fn<BacklogType["getIssueTypes"]>()
  .mockResolvedValue([
    {
      id: 2,
      name: "Bug",
      projectId: 1,
      displayOrder: 1,
    },
  ] as Issue.IssueType[]);

export const getPriorities = vi
  .fn<BacklogType["getPriorities"]>()
  .mockResolvedValue([{ id: 3, name: "High" }] as Issue.Priority[]);

export const getStatuses = vi
  .fn<BacklogType["getStatuses"]>()
  .mockResolvedValue([
    { id: 4, name: "Open" },
    { id: 5, name: "Closed" },
  ]);

export const postIssue = vi
  .fn<BacklogType["postIssue"]>()
  .mockResolvedValue({ id: 10, issueKey: "ABC-123" } as Issue.Issue);

export const patchIssue = vi
  .fn<BacklogType["patchIssue"]>()
  .mockResolvedValue({} as Issue.Issue);

export const getProjectStatuses = vi
  .fn<BacklogType["getProjectStatuses"]>()
  .mockResolvedValue([
    { id: 6, name: "Open" },
    { id: 7, name: "Closed" },
  ] as Project.ProjectStatus[]);

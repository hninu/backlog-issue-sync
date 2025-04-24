import { Backlog } from "./index.js";

// backlog-host: wmnbdev.backlog.com
//     github-token: ***
//     backlog-api-key: ***
//     backlog-project-key: MFREBIRTH
//     backlog-issue-type: 課題
//     backlog-priority: 中
//     backlog-initial-status: 未対応
//     backlog-completed-status: 完了

it("test", async () => {
	// const backlog = new Backlog({
	// 	host: "wmnbdev.backlog.com",
	// 	apiKey: "xxx",
	// 	projectIdOrKey: "MFREBIRTH",
	// 	issueTypeIdOrName: "課題",
	// 	priorityIdOrName: "中",
	// 	initialStatusIdOrName: "未対応",
	// 	completedStatusIdOrName: "完了",
	// });

	// await backlog.init();
	const text =
		"aaabacklog [#MFREBIRTH-750](https://wmnbdev.backlog.com/view/MFREBIRTH-750)bbb";

	const extracted = Backlog.extractBacklogTag(text);

	expect(extracted).toBe("MFREBIRTH-750");
});

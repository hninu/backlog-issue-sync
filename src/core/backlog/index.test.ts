import { Backlog } from "./index.js";

describe("Backlog.backlogRegex", () => {
	it("extracts key when surrounded by text", () => {
		const text = "foo backlog [#ABC-123](https://host/view/ABC-123) bar";
		expect(Backlog.extractBacklogTag(text)).toBe("ABC-123");
	});
	it("is case insensitive", () => {
		const text = "BaCkLoG [#XYZ](https://host/view/XYZ)";
		expect(Backlog.extractBacklogTag(text)).toBe("XYZ");
	});
	it("returns null when no backlog tag present", () => {
		const text = "no backlog here";
		expect(Backlog.extractBacklogTag(text)).toBeNull();
	});
});

describe("makeBacklogTag", () => {
	it("creates proper markdown link", () => {
		const tag = Backlog.makeBacklogTag("KEY", "wmnbdev.backlog.com");
		expect(tag).toBe("backlog [#KEY](https://wmnbdev.backlog.com/view/KEY)");
	});
});

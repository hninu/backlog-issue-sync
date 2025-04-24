// Utility functions for Backlog and GitHub tag handling

/**
 * Extracts `backlog #KEY` from GitHub issue body.
 */
export function extractBacklogTag(text: string): string | null {
	const backlogRegex = /backlog\s+\[#([A-Z0-9\-_]+)\]\(.*\)/i;
	const match = text.match(backlogRegex);
	return match ? match[1] : null;
}

/**
 * Generates a Markdown link for backlog #KEY.
 */
export function makeBacklogTag(key: string, host: string): string {
	const url = `https://${host}/view/${key}`;
	return `backlog [#${key}](${url})`;
}

/**
 * Generates a Markdown link for github #KEY.
 */
export function makeGithubTag(key: string, url: string): string {
	return `github [#${key}](${url})`;
}

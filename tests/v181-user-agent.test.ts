import test from "node:test";
import assert from "node:assert/strict";
import { giteaUserAgent } from "../src/util.ts";
import { Gitea } from "../src/gitea.ts";
import type { HttpRequest, HttpResponse } from "../src/http.ts";

const OBSIDIAN_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) obsidian/1.15.1 Chrome/150.0.7871.250 Electron/43.8.9 Safari/537.36";

test("giteaUserAgent: keeps Obsidian's runtime version, raises only an old Chromium version", () => {
	assert.equal(giteaUserAgent(OBSIDIAN_UA), OBSIDIAN_UA.replace("Chrome/150.0.7871.250", "Chrome/151.0.0.0"));
	const newer = OBSIDIAN_UA.replace("Chrome/150.0.7871.250", "Chrome/152.1.2.3");
	assert.equal(giteaUserAgent(newer), newer);
	const safari = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
	assert.equal(giteaUserAgent(safari), safari);
	assert.equal(giteaUserAgent(""), "Mozilla/5.0 Chrome/151.0.0.0");
});

test("Gitea API requests send the compatible User-Agent header", async () => {
	let seen: HttpRequest | null = null;
	const transport = async (req: HttpRequest): Promise<HttpResponse> => {
		seen = req;
		return { status: 200, json: { login: "rabc" }, arrayBuffer: new ArrayBuffer(0), headers: {} };
	};
	const gitea = new Gitea(() => ({ token: "t", apiBase: "https://gitea.test/api/v1", owner: "me", repo: "vault" }), transport);
	await gitea.getUser();
	assert.ok(seen);
	const req = seen as HttpRequest;
	assert.equal(req.headers["User-Agent"], giteaUserAgent());
});

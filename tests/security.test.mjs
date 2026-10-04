import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (/\.(js|jsx|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test("source has no initial-admin registration shortcut or insecure OTP RNG", async () => {
  const files = await walk(new URL("../src", import.meta.url).pathname);
  const text = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.equal(text.includes("INITIAL_ADMIN_EMAIL"), false);
  assert.equal(/Math\.random\(\).*OTP|OTP.*Math\.random\(\)/s.test(text), false);
  assert.equal(text.includes('cookieStore.get("token")'), false);
});

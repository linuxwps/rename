import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), "rname-list-window-tests-"));

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const source = readFileSync(join(sourceDir, "listWindow.ts"), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const outputPath = join(tempDir, "listWindow.mjs");
writeFileSync(outputPath, output);
const { computeVisibleRange } = await import(pathToFileURL(outputPath).href);

test("大列表只渲染视口附近项目", () => {
  const offsets = Array.from({ length: 1001 }, (_, index) => index * 34);
  const range = computeVisibleRange(offsets, 34 * 500, 340, 34, 2);
  assert.equal(range.start, 497);
  assert.ok(range.end >= 509);
  assert.ok(range.end - range.start < 20);
});

test("视口位于顶部和底部时范围不会越界", () => {
  const offsets = Array.from({ length: 101 }, (_, index) => index * 34);
  assert.deepEqual(computeVisibleRange(offsets, 0, 340, 34, 2), {
    start: 0,
    end: 13,
  });
  const bottom = computeVisibleRange(offsets, 34 * 99, 340, 34, 2);
  assert.equal(bottom.start, 96);
  assert.equal(bottom.end, 100);
});

test("空列表返回空可见范围", () => {
  assert.deepEqual(computeVisibleRange([0], 0, 340, 34, 2), {
    start: 0,
    end: 0,
  });
});

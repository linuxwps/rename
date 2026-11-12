import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), "rname-file-order-tests-"));

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const source = readFileSync(join(sourceDir, "fileOrder.ts"), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const outputPath = join(tempDir, "fileOrder.mjs");
writeFileSync(outputPath, output);
const { moveItemById } = await import(pathToFileURL(outputPath).href);

const files = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("手动排序可以向前和向后移动文件", () => {
  assert.deepEqual(moveItemById(files, "c", "a"), [
    { id: "c" },
    { id: "a" },
    { id: "b" },
  ]);
  assert.deepEqual(moveItemById(files, "a", "c"), [
    { id: "b" },
    { id: "c" },
    { id: "a" },
  ]);
});

test("未知 ID 或位置不变时返回原数组", () => {
  assert.equal(moveItemById(files, "missing", "a"), files);
  assert.equal(moveItemById(files, "a", "a"), files);
});

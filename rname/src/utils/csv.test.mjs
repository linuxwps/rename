import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), "rname-csv-tests-"));

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const source = readFileSync(join(sourceDir, "csv.ts"), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const outputPath = join(tempDir, "csv.mjs");
writeFileSync(outputPath, output);
const { extractCsvPaths, parseCsv, parseCsvPathMappings, toCsv } = await import(
  pathToFileURL(outputPath).href
);

test("CSV 导出会正确转义逗号、引号和换行", () => {
  const csv = toCsv([
    ["path", "newName"],
    ['/tmp/a,b.txt', 'say "hi"\nnext'],
  ]);
  assert.equal(csv, 'path,newName\r\n"/tmp/a,b.txt","say ""hi""\nnext"');
  assert.deepEqual(parseCsv(csv), [
    ["path", "newName"],
    ["/tmp/a,b.txt", 'say "hi"\nnext'],
  ]);
});

test("CSV 路径列支持中英文标题并跳过空行", () => {
  const paths = extractCsvPaths(
    "\uFEFF路径,新文件名\n/tmp/一.jpg,20250101_一.jpg\n\n/tmp/二.jpg,20250102_二.jpg\n"
  );
  assert.deepEqual(paths, ["/tmp/一.jpg", "/tmp/二.jpg"]);
});

test("CSV 导入会解析新文件名映射", () => {
  const result = parseCsvPathMappings(
    "原路径,新文件名\n/tmp/a.jpg,20250101_a.jpg\n/tmp/b.jpg,20250102_b.jpg\n"
  );
  assert.deepEqual(result.paths, ["/tmp/a.jpg", "/tmp/b.jpg"]);
  assert.equal(result.targetNames.get("/tmp/a.jpg"), "20250101_a.jpg");
  assert.equal(result.targetNames.get("/tmp/b.jpg"), "20250102_b.jpg");
});

test("无标题 CSV 默认使用第一列并去重", () => {
  assert.deepEqual(
    extractCsvPaths("/tmp/a.txt\n/tmp/a.txt\n/tmp/b.txt"),
    ["/tmp/a.txt", "/tmp/b.txt"]
  );
});

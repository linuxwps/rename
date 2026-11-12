import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("./rename.ts", import.meta.url),
  "utf8"
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const renameUtils = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`
);

const {
  planRenameOperation,
  splitFileName,
  validateFileName,
} = renameUtils;

test("隐藏文件名不会被误判为扩展名", () => {
  assert.deepEqual(splitFileName(".env"), {
    baseName: ".env",
    extension: "",
  });
  assert.deepEqual(splitFileName("archive.tar.gz"), {
    baseName: "archive.tar",
    extension: "gz",
  });
});

test("目标已存在时阻止覆盖", () => {
  const result = planRenameOperation(
    [
      {
        fileId: "a",
        originalPath: "/tmp/a.txt",
        finalPath: "/tmp/b.txt",
      },
    ],
    new Set(["/tmp/b.txt"]),
    "linux"
  );

  assert.equal(result.issues.length, 1);
  assert.match(result.issues[0].message, /已存在/);
});

test("名称链条会先释放被占用的目标", () => {
  const result = planRenameOperation(
    [
      {
        fileId: "a",
        originalPath: "/tmp/a.txt",
        finalPath: "/tmp/b.txt",
      },
      {
        fileId: "b",
        originalPath: "/tmp/b.txt",
        finalPath: "/tmp/c.txt",
      },
    ],
    new Set(["/tmp/a.txt", "/tmp/b.txt"]),
    "linux"
  );

  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.renameOrder, [1, 0]);
});

test("交换名称会先生成更新计划", () => {
  const result = planRenameOperation(
    [
      {
        fileId: "a",
        originalPath: "/tmp/a.txt",
        finalPath: "/tmp/b.txt",
      },
      {
        fileId: "b",
        originalPath: "/tmp/b.txt",
        finalPath: "/tmp/a.txt",
      },
    ],
    new Set(["/tmp/a.txt", "/tmp/b.txt"]),
    "linux"
  );

  assert.deepEqual(result.issues, []);
  assert.equal(result.renameOrder.length, 2);
});

test("同批次生成相同目标会阻止执行", () => {
  const result = planRenameOperation(
    [
      {
        fileId: "a",
        originalPath: "/tmp/a.txt",
        finalPath: "/tmp/same.txt",
      },
      {
        fileId: "b",
        originalPath: "/tmp/b.txt",
        finalPath: "/tmp/same.txt",
      },
    ],
    new Set(["/tmp/a.txt", "/tmp/b.txt"]),
    "macos"
  );

  assert.equal(result.issues.length, 2);
  assert.match(result.issues[0].message, /相同/);
});

test("按平台检查非法文件名", () => {
  assert.match(validateFileName("CON.txt", "windows"), /保留/);
  assert.match(validateFileName("file?.txt", "windows"), /不能包含/);
  assert.equal(validateFileName("file?.txt", "macos"), null);
  assert.equal(validateFileName("legal.txt", "macos"), null);
});

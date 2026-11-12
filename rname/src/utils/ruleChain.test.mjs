import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const tempDir = mkdtempSync(join(tmpdir(), "rname-rule-tests-"));

after(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function transpile(fileName, replacements = {}) {
  let source = readFileSync(join(sourceDir, fileName), "utf8");
  for (const [specifier, replacement] of Object.entries(replacements)) {
    source = source.replaceAll(
      JSON.stringify(specifier),
      JSON.stringify(replacement)
    );
  }

  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const outputName = fileName.replace(/\.ts$/, ".mjs");
  writeFileSync(join(tempDir, outputName), output);
  return pathToFileURL(join(tempDir, outputName)).href;
}

async function loadModule(fileName, replacements) {
  return import(transpile(fileName, replacements));
}

const renameUtils = await loadModule("./rename.ts");
transpile("./exifDate.ts");
const ruleChain = await loadModule("./ruleChain.ts");
const pipeline = await loadModule("./renamePipeline.ts", {
  "./rename": "./rename.mjs",
  "./exifDate": "./exifDate.mjs",
});
const presets = await loadModule("./presets.ts", {
  "./ruleChain": "./ruleChain.mjs",
});

const { splitFileName } = renameUtils;
const {
  MAX_RENAME_RULES,
  cloneRule,
  cloneRulesWithFreshIds,
  createRule,
  describeRule,
  hasEffectiveRules,
  moveRule,
  moveRuleById,
  removeRule,
} = ruleChain;
const { applyRenamePipeline } = pipeline;
const { applyRenamePreset, upsertRenamePreset } = presets;

function file(name, id = name) {
  const parts = splitFileName(name);
  return {
    id,
    path: "/tmp/" + name,
    name,
    extension: parts.extension,
    size: 1,
    modifiedAt: 0,
    createdAt: 0,
    exifTakenAt: null,
  };
}

test("规则链会按数组顺序逐条执行", () => {
  const prefix = createRule("prefix", "p1");
  prefix.config.text = "A";
  const suffix = createRule("suffix", "s1");
  suffix.config.text = "Z";
  const replace = createRule("replace", "r1");
  replace.config.findText = "Aabc";
  replace.config.replaceText = "XY";

  const result = applyRenamePipeline(
    file("abc.txt"),
    [prefix, suffix, replace],
    0,
    1
  );

  assert.equal(result.newBaseName, "XYZ");
  assert.equal(result.newExtension, "txt");
  assert.deepEqual(
    result.steps.map((step) => step.ruleId),
    ["p1", "s1", "r1"]
  );
  assert.deepEqual(
    result.steps.map((step) => step.changed),
    [true, true, true]
  );
  assert.equal(result.steps[2].beforeFullName, "AabcZ.txt");
  assert.equal(result.steps[2].afterFullName, "XYZ.txt");
});

test("停用的规则会跳过且不产生中间步骤", () => {
  const prefix = createRule("prefix", "p1");
  prefix.config.text = "A";
  prefix.enabled = false;
  const suffix = createRule("suffix", "s1");
  suffix.config.text = "Z";

  const result = applyRenamePipeline(file("abc.txt"), [prefix, suffix], 0, 1);
  assert.equal(result.newBaseName, "abcZ");
  assert.deepEqual(result.steps.map((step) => step.ruleId), ["s1"]);
});

test("单条规则的预览步骤保留处理前后文件名", () => {
  const prefix = createRule("prefix", "p1");
  prefix.config.text = "A";
  const result = applyRenamePipeline(file("abc.txt"), [prefix], 0, 1);
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].beforeFullName, "abc.txt");
  assert.equal(result.steps[0].afterFullName, "Aabc.txt");
});

test("大小写规则只转换主文件名并保留扩展名", () => {
  const lowercase = createRule("case", "lower");
  lowercase.config.mode = "lowercase";
  const lowered = applyRenamePipeline(
    file("MyPhoto.JPG"),
    [lowercase],
    0,
    1
  );
  assert.equal(lowered.newBaseName, "myphoto");
  assert.equal(lowered.newExtension, "JPG");

  lowercase.config.mode = "uppercase";
  const uppercased = applyRenamePipeline(
    file("my-photo.jpeg"),
    [lowercase],
    0,
    1
  );
  assert.equal(uppercased.newBaseName, "MY-PHOTO");
  assert.equal(uppercased.newExtension, "jpeg");
});

test("单词首字母大写会处理空格、连字符和下划线边界", () => {
  const title = createRule("case", "title");
  title.config.mode = "title";
  const result = applyRenamePipeline(
    file("my_FILE name-v2_TAG.txt"),
    [title],
    0,
    1
  );
  assert.equal(result.newBaseName, "My_File Name-V2_Tag");
});

test("删除和移动规则返回新数组且不改原数组", () => {
  const one = createRule("prefix", "1");
  one.config.text = "1";
  const two = createRule("suffix", "2");
  two.config.text = "2";
  const three = createRule("prefix", "3");
  three.config.text = "3";
  const original = [one, two, three];

  assert.deepEqual(
    removeRule(original, "2").map((rule) => rule.id),
    ["1", "3"]
  );
  assert.deepEqual(
    original.map((rule) => rule.id),
    ["1", "2", "3"]
  );
  assert.deepEqual(
    moveRule(original, 0, 2).map((rule) => rule.id),
    ["2", "3", "1"]
  );
  assert.deepEqual(
    moveRuleById(original, "2", -1).map((rule) => rule.id),
    ["2", "1", "3"]
  );
});

test("复制规则会生成新 ID 并独立复制配置", () => {
  const original = createRule("regex", "r1");
  original.config.pattern = "x";
  const clone = cloneRule(original);
  assert.notEqual(clone.id, original.id);
  assert.equal(clone.config.pattern, "x");
  clone.config.pattern = "y";
  assert.equal(original.config.pattern, "x");
});

test("从预设加载规则会重新分配 ID并保留配置", () => {
  const rule = createRule("prefix", "same-id");
  rule.config.text = "A";
  const { presets: saved } = upsertRenamePreset([], "常用", [rule]);
  const loaded = applyRenamePreset(saved[0]);
  assert.equal(loaded.length, 1);
  assert.notEqual(loaded[0].id, "same-id");
  assert.equal(loaded[0].config.text, "A");
});

test("预设保存会把规则限制在十条以内", () => {
  const rules = [];
  for (let index = 0; index < MAX_RENAME_RULES + 1; index += 1) {
    rules.push(createRule("prefix", `p${index}`));
  }
  const { presets: saved } = upsertRenamePreset([], "太多了", rules);
  assert.equal(saved[0].rules.length, MAX_RENAME_RULES);
});

test("describeRule 输出可读摘要", () => {
  const prefix = createRule("prefix", "p1");
  prefix.config.text = "新";
  assert.match(describeRule(prefix), /新/);

  const regex = createRule("regex", "r1");
  regex.config.pattern = "a+";
  assert.match(describeRule(regex), /a\+/);

  const extension = createRule("extension", "e1");
  extension.config.mode = "remove";
  assert.match(describeRule(extension), /移除/);

  const caseRule = createRule("case", "c1");
  caseRule.config.mode = "uppercase";
  assert.match(describeRule(caseRule), /大写/);
});

test("空配置规则不会被视为可执行规则", () => {
  const prefix = createRule("prefix", "p1");
  assert.equal(hasEffectiveRules([prefix]), false);

  prefix.config.text = "新";
  assert.equal(hasEffectiveRules([prefix]), true);

  prefix.enabled = false;
  assert.equal(hasEffectiveRules([prefix]), false);

  const removeExtension = createRule("extension", "e1");
  removeExtension.config.mode = "remove";
  assert.equal(hasEffectiveRules([removeExtension]), true);

  const caseRule = createRule("case", "c1");
  assert.equal(hasEffectiveRules([caseRule]), true);
});

test("批量复制规则时 ID 全部独立", () => {
  const rules = [createRule("prefix", "a"), createRule("suffix", "b")];
  const cloned = cloneRulesWithFreshIds(rules);
  assert.equal(cloned.length, 2);
  assert.notEqual(cloned[0].id, cloned[1].id);
  assert.ok(!rules.some((rule, index) => rule.id === cloned[index].id));
});

test("EXIF 日期规则优先使用拍摄时间", () => {
  const rule = createRule("exif", "exif1");
  rule.config.source = "taken";
  rule.config.fallback = "next";
  rule.config.format = "YYYYMMDD";
  rule.config.position = "before";
  rule.config.separator = "_";
  const item = file("IMG_1234.jpg");
  item.exifTakenAt = new Date(2025, 10, 12, 9, 30).getTime();
  item.createdAt = new Date(2024, 0, 1).getTime();

  const result = applyRenamePipeline(item, [rule], 0, 1);
  assert.equal(result.newBaseName, "20251112_IMG_1234");
  assert.equal(result.newExtension, "jpg");
});

test("EXIF 日期缺失时按拍摄→创建→修改回退", () => {
  const rule = createRule("exif", "exif2");
  rule.config.source = "taken";
  rule.config.fallback = "next";
  rule.config.format = "YYYYMMDD";
  rule.config.position = "after";
  rule.config.separator = "-";
  const item = file("IMG_1234.jpg");
  item.exifTakenAt = null;
  item.createdAt = new Date(2023, 5, 15).getTime();

  const result = applyRenamePipeline(item, [rule], 0, 1);
  assert.equal(result.newBaseName, "IMG_1234-20230615");
});

test("EXIF 严格模式缺失时报错", () => {
  const rule = createRule("exif", "exif3");
  rule.config.source = "taken";
  rule.config.fallback = "error";
  const item = file("PIC.png");
  item.exifTakenAt = null;
  item.createdAt = 1_700_000_000_000;

  const result = applyRenamePipeline(item, [rule], 0, 1);
  assert.equal(result.error, "所选日期来源缺失，无法生成文件名");
  assert.equal(result.newBaseName, "PIC");
  assert.equal(result.newExtension, "png");
});

test("EXIF 日期可以在替换位置使用且带时分秒", () => {
  const rule = createRule("exif", "exif4");
  rule.config.source = "taken";
  rule.config.fallback = "next";
  rule.config.format = "YYYYMMDD_HHmmss";
  rule.config.position = "replace";
  const item = file("DSCF0099.HEIC");
  item.exifTakenAt = new Date(2025, 0, 2, 14, 30, 25).getTime();

  const result = applyRenamePipeline(item, [rule], 0, 1);
  assert.equal(result.newBaseName, "20250102_143025");
  assert.equal(result.newExtension, "HEIC");
});

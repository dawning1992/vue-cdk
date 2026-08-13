/**
 * 测试环境检测，对应 Angular CDK platform 的 `features/test-environment.ts`。
 *
 * Angular 的 `_isTestEnvironment` 为内部工具，按仓库惯例导出为不带下划线的
 * `isTestEnvironment`，文档站 API 对照表中有明确映射说明。
 */

/**
 * 判断代码当前是否运行在测试环境中。
 *
 * 检测 Karma / Jasmine / Jest / Mocha 四类运行器暴露的全局标记。
 * 通过 `globalThis` 索引访问而非直接引用标识符，避免 TypeScript
 * 因全局未声明而报错，也兼容浏览器与 Node 两类执行环境。
 */
export function isTestEnvironment(): boolean {
  const globals = globalThis as Record<string, unknown>;
  return !!(
    globals.__karma__ ||
    globals.jasmine ||
    globals.jest ||
    globals.Mocha
  );
}

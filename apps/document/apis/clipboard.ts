import type {ApiGroup} from '../api';

/** clipboard 模块 API 分组：命令式复制、延迟复制、声明式指令与全局配置。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '命令式复制',
    titleEn: 'Imperative copying',
    rows: [
      {
        name: 'useClipboard',
        signature: 'useClipboard(): Clipboard',
        description:
          '组合式入口，返回模块级剪贴板单例，对应 Angular 中注入 Clipboard 服务；需要自定义 document（如 iframe）时直接 new Clipboard(document)。',
        descriptionEn:
          'Composable entry point returning the module-level clipboard singleton, matching Angular Clipboard injection; use new Clipboard(document) for a custom document such as an iframe.',
      },
      {
        name: 'Clipboard',
        signature: 'class Clipboard（constructor(document?: Document)）',
        description:
          '剪贴板服务：document 缺省时懒解析全局 document。SSR（无 document）下 copy() 返回 false、beginCopy() 抛错，模块可安全导入。',
        descriptionEn:
          'Clipboard service that lazily resolves the global document when omitted. In SSR without a document, copy() returns false and beginCopy() throws, while importing the module remains safe.',
      },
      {
        name: 'clipboard',
        signature: 'const clipboard: Clipboard',
        description: '以全局 document 为环境的默认单例，供命令式复制直接使用。',
        descriptionEn: 'Default singleton using the global document for direct imperative copying.',
      },
      {
        name: 'Clipboard.copy',
        signature: 'copy(text: string): boolean',
        description:
          '同步复制文本并返回是否成功；内部创建隐藏 textarea 执行 execCommand("copy")，立即清理且不改变焦点。适合小文本。',
        descriptionEn:
          'Copies text synchronously and returns whether it succeeded. It creates and immediately removes a hidden textarea for execCommand("copy") without changing focus; suitable for small text.',
      },
      {
        name: 'Clipboard.beginCopy',
        signature: 'beginCopy(text: string): PendingCopy',
        description:
          '预加载文本并返回待执行的复制操作（大文本先完成 textarea 重排，避免超出浏览器复制时间窗口）；调用方必须在结束后调用 destroy()。',
        descriptionEn:
          'Preloads text and returns a pending copy operation. Large text can complete textarea layout before the copy window expires; callers must call destroy() when finished.',
      },
    ],
  },
  {
    title: '延迟复制',
    titleEn: 'Deferred copying',
    rows: [
      {
        name: 'PendingCopy',
        signature: 'class PendingCopy（constructor(text: string, document: Document)）',
        description:
          '延迟复制操作：构建隐藏 textarea（fixed、透明、aria-hidden、readOnly），插入 fullscreenElement || body，复制时选中内容并还原焦点。',
        descriptionEn:
          'Deferred copy operation that creates a hidden textarea (fixed, transparent, aria-hidden, and readOnly), inserts it into fullscreenElement || body, selects its content during copying, and restores focus.',
      },
      {
        name: 'PendingCopy.copy',
        signature: 'copy(): boolean',
        description: '执行复制并返回是否成功；浏览器不支持或 execCommand 抛错时返回 false，不抛异常。',
        descriptionEn: 'Performs the copy and returns whether it succeeded; unsupported browsers or execCommand errors return false without throwing.',
      },
      {
        name: 'PendingCopy.destroy',
        signature: 'destroy(): void',
        description:
          '清理复制过程创建的 textarea，幂等；无论是否调用过 copy()，使用结束后都必须调用。',
        descriptionEn:
          'Removes the textarea created for copying and is idempotent. It must be called when finished, whether or not copy() was called.',
      },
    ],
  },
  {
    title: '声明式指令',
    titleEn: 'Declarative directive',
    rows: [
      {
        name: 'vCopyToClipboard',
        signature: 'Directive<HTMLElement, CopyToClipboardValue>',
        description:
          '点击复制的指令，对应 Angular cdkCopyToClipboard；模板用法 v-copy-to-clipboard。需注册：app.directive("copy-to-clipboard", vCopyToClipboard) 或组件内局部注册。',
        descriptionEn:
          'Click-to-copy directive corresponding to Angular cdkCopyToClipboard; use v-copy-to-clipboard in templates. Register it with app.directive("copy-to-clipboard", vCopyToClipboard) or locally in a component.',
      },
      {
        name: 'CopyToClipboardOptions',
        signature: '{text: string | Ref<string>; attempts?: number; onCopied?: (successful: boolean) => void}',
        description:
          '对象绑定参数：text 支持 Ref 并在点击时解包最新值；attempts 默认 1、上限 50（长文本可加大以等待浏览器填充中间 textarea）；onCopied 在复制结束（成功或最终失败）后回调一次。',
        descriptionEn:
          'Object binding options: text accepts a Ref and unwraps its latest value on click; attempts defaults to 1 and is capped at 50; onCopied runs once after copying succeeds or finally fails.',
      },
      {
        name: 'CopyToClipboardValue',
        signature: 'string | Ref<string> | CopyToClipboardOptions',
        description: '指令绑定值：字符串/Ref 简写（不关心结果）或完整参数对象（携带 attempts 与 onCopied）。',
        descriptionEn: 'Directive binding value: a string or Ref shorthand when the result is irrelevant, or a full options object with attempts and onCopied.',
      },
    ],
  },
  {
    title: '全局默认配置',
    titleEn: 'Global defaults',
    rows: [
      {
        name: 'CDK_COPY_TO_CLIPBOARD_CONFIG',
        signature: 'InjectionKey<CdkCopyToClipboardConfig>',
        description:
          '默认配置注入键，对应 Angular CDK_COPY_TO_CLIPBOARD_CONFIG；App 级用 app.provide(token, {attempts})，组件级用 provideCopyToClipboardConfig。',
        descriptionEn:
          'Injection key for defaults, corresponding to Angular CDK_COPY_TO_CLIPBOARD_CONFIG; use app.provide(token, {attempts}) at app scope or provideCopyToClipboardConfig in a component.',
      },
      {
        name: 'provideCopyToClipboardConfig',
        signature: 'provideCopyToClipboardConfig(config: CdkCopyToClipboardConfig): void',
        description:
          '在组件 setup 中向其子树提供默认 attempts；后代指令绑定未显式传 attempts 时生效。',
        descriptionEn:
          'Provides a default attempts value to the component subtree; it applies when descendant directive bindings omit attempts.',
      },
      {
        name: 'CdkCopyToClipboardConfig',
        signature: 'type {attempts?: number}',
        description: '全局默认配置类型，attempts 为默认复制重试次数（上限 50）。',
        descriptionEn: 'Global defaults type; attempts is the default number of copy retries, capped at 50.',
      },
    ],
  },
];

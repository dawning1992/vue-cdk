import type {ApiGroup} from '../api';

/** clipboard 模块 API 分组：命令式复制、延迟复制、声明式指令与全局配置。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '命令式复制',
    rows: [
      {
        name: 'useClipboard',
        signature: 'useClipboard(): Clipboard',
        description:
          '组合式入口，返回模块级剪贴板单例，对应 Angular 中注入 Clipboard 服务；需要自定义 document（如 iframe）时直接 new Clipboard(document)。',
      },
      {
        name: 'Clipboard',
        signature: 'class Clipboard（constructor(document?: Document)）',
        description:
          '剪贴板服务：document 缺省时懒解析全局 document。SSR（无 document）下 copy() 返回 false、beginCopy() 抛错，模块可安全导入。',
      },
      {
        name: 'clipboard',
        signature: 'const clipboard: Clipboard',
        description: '以全局 document 为环境的默认单例，供命令式复制直接使用。',
      },
      {
        name: 'Clipboard.copy',
        signature: 'copy(text: string): boolean',
        description:
          '同步复制文本并返回是否成功；内部创建隐藏 textarea 执行 execCommand("copy")，立即清理且不改变焦点。适合小文本。',
      },
      {
        name: 'Clipboard.beginCopy',
        signature: 'beginCopy(text: string): PendingCopy',
        description:
          '预加载文本并返回待执行的复制操作（大文本先完成 textarea 重排，避免超出浏览器复制时间窗口）；调用方必须在结束后调用 destroy()。',
      },
    ],
  },
  {
    title: '延迟复制',
    rows: [
      {
        name: 'PendingCopy',
        signature: 'class PendingCopy（constructor(text: string, document: Document)）',
        description:
          '延迟复制操作：构建隐藏 textarea（fixed、透明、aria-hidden、readOnly），插入 fullscreenElement || body，复制时选中内容并还原焦点。',
      },
      {
        name: 'PendingCopy.copy',
        signature: 'copy(): boolean',
        description: '执行复制并返回是否成功；浏览器不支持或 execCommand 抛错时返回 false，不抛异常。',
      },
      {
        name: 'PendingCopy.destroy',
        signature: 'destroy(): void',
        description:
          '清理复制过程创建的 textarea，幂等；无论是否调用过 copy()，使用结束后都必须调用。',
      },
    ],
  },
  {
    title: '声明式指令',
    rows: [
      {
        name: 'vCopyToClipboard',
        signature: 'Directive<HTMLElement, CopyToClipboardValue>',
        description:
          '点击复制的指令，对应 Angular cdkCopyToClipboard；模板用法 v-copy-to-clipboard。需注册：app.directive("copy-to-clipboard", vCopyToClipboard) 或组件内局部注册。',
      },
      {
        name: 'CopyToClipboardOptions',
        signature: '{text: string | Ref<string>; attempts?: number; onCopied?: (successful: boolean) => void}',
        description:
          '对象绑定参数：text 支持 Ref 并在点击时解包最新值；attempts 默认 1、上限 50（长文本可加大以等待浏览器填充中间 textarea）；onCopied 在复制结束（成功或最终失败）后回调一次。',
      },
      {
        name: 'CopyToClipboardValue',
        signature: 'string | Ref<string> | CopyToClipboardOptions',
        description: '指令绑定值：字符串/Ref 简写（不关心结果）或完整参数对象（携带 attempts 与 onCopied）。',
      },
    ],
  },
  {
    title: '全局默认配置',
    rows: [
      {
        name: 'CDK_COPY_TO_CLIPBOARD_CONFIG',
        signature: 'InjectionKey<CdkCopyToClipboardConfig>',
        description:
          '默认配置注入键，对应 Angular CDK_COPY_TO_CLIPBOARD_CONFIG；App 级用 app.provide(token, {attempts})，组件级用 provideCopyToClipboardConfig。',
      },
      {
        name: 'provideCopyToClipboardConfig',
        signature: 'provideCopyToClipboardConfig(config: CdkCopyToClipboardConfig): void',
        description:
          '在组件 setup 中向其子树提供默认 attempts；后代指令绑定未显式传 attempts 时生效。',
      },
      {
        name: 'CdkCopyToClipboardConfig',
        signature: 'type {attempts?: number}',
        description: '全局默认配置类型，attempts 为默认复制重试次数（上限 50）。',
      },
    ],
  },
];

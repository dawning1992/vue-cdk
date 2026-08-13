/**
 * clipboard 模块入口，对齐 Angular CDK 的 `@angular/cdk/clipboard` public-api。
 *
 * 覆盖能力：
 * - 命令式：Clipboard 类 + clipboard 单例 + useClipboard() 组合式；
 * - 延迟复制：PendingCopy（隐藏 textarea + execCommand，支持重试）；
 * - 声明式：vCopyToClipboard 指令（字符串简写或 {text, attempts, onCopied} 对象）；
 * - 全局默认配置：CDK_COPY_TO_CLIPBOARD_CONFIG 注入键与 provideCopyToClipboardConfig()。
 */

export {Clipboard, clipboard, useClipboard} from './clipboard';
export {PendingCopy} from './pending-copy';
export {
  vCopyToClipboard,
  CDK_COPY_TO_CLIPBOARD_CONFIG,
  provideCopyToClipboardConfig,
  type CdkCopyToClipboardConfig,
  type CopyToClipboardOptions,
  type CopyToClipboardValue,
} from './copy-to-clipboard';

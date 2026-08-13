import {PendingCopy} from './pending-copy';

/**
 * 剪贴板服务，对应 Angular CDK 的 Clipboard。
 *
 * 职责：把文本复制到系统剪贴板。`copy` 适合小文本的同步复制；
 * 大文本建议先 `beginCopy` 预加载 DOM，再择机调用 PendingCopy.copy() 重试。
 *
 * 无 document 的环境（SSR）下模块可安全导入：`copy` 返回 false，
 * `beginCopy` 抛出明确错误，调用方应据此降级。
 */
export class Clipboard {
  private readonly _document: Document | undefined;

  /**
   * @param document 可注入自定义 Document（如 iframe 内容文档）；
   *   缺省时懒解析全局 document，SSR 下保持 undefined。
   */
  constructor(document?: Document) {
    this._document =
      document ??
      (typeof globalThis.document !== 'undefined' ? globalThis.document : undefined);
  }

  /**
   * 把文本复制到剪贴板。
   *
   * @param text 要复制的字符串。
   * @returns 复制是否成功；无浏览器 document 时恒为 false。
   * @副作用 内部创建并立即销毁隐藏 textarea，不改变焦点。
   */
  copy(text: string): boolean {
    if (!this._document) {
      return false;
    }

    const pendingCopy = this.beginCopy(text);
    const successful = pendingCopy.copy();
    pendingCopy.destroy();

    return successful;
  }

  /**
   * 预加载文本并返回待执行的复制操作，适合大文本在后续时机重试复制。
   *
   * @param text 要复制的字符串。
   * @returns 待执行复制操作；调用方必须在使用结束后调用其 destroy()。
   * @throws 无浏览器 document（SSR）时抛出错误。
   */
  beginCopy(text: string): PendingCopy {
    if (!this._document) {
      throw new Error('Clipboard.beginCopy() 需要浏览器环境（当前没有 document）。');
    }

    return new PendingCopy(text, this._document);
  }
}

/** 默认剪贴板单例：以当前全局 document 为环境，可直接命令式复制。 */
export const clipboard = new Clipboard();

/**
 * 获取剪贴板服务（组合式入口）。
 *
 * 对应 Angular 中注入 Clipboard 服务的使用方式；始终返回模块级单例。
 * 需要自定义 document（如 iframe）时请直接 `new Clipboard(document)`。
 */
export function useClipboard(): Clipboard {
  return clipboard;
}

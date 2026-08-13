/**
 * 延迟复制操作，移植自 Angular CDK clipboard 的 PendingCopy
 * （https://github.com/angular/components，MIT License，原版权 Google LLC）。
 *
 * 复制文本到剪贴板需要修改 DOM 并强制重排（re-layout）；文本较长时该过程可能
 * 超过浏览器允许的「用户点击后执行复制命令」时间窗口，导致 execCommand('copy')
 * 被拒绝。本类把「构建隐藏 textarea」与「执行复制」拆成两个时机：先 beginCopy
 * 完成重排，随后任意时刻调用 copy() 完成复制，供大文本重试场景使用。
 *
 * 约定：无论是否调用 copy()，调用方都必须在使用结束后调用 destroy() 清理 DOM。
 */
export class PendingCopy {
  private _textarea: HTMLTextAreaElement | undefined;

  constructor(
    text: string,
    private readonly _document: Document,
  ) {
    const textarea = (this._textarea = this._document.createElement('textarea'));
    const styles = textarea.style;

    // 对显示与无障碍隐藏；fixed + top:0 使 textarea 位于视口内，
    // 避免复制瞬间 focus 到屏幕外元素时浏览器滚动页面。left:-999em 兜底隐藏。
    styles.position = 'fixed';
    styles.top = styles.opacity = '0';
    styles.left = '-999em';
    textarea.setAttribute('aria-hidden', 'true');
    textarea.value = text;
    // readonly 防止 iOS Safari 聚焦 textarea 时屏幕跳动（对应 Angular #25169）。
    textarea.readOnly = true;
    // 页面处于全屏模式时须插入全屏容器，否则浏览器拒绝执行复制命令。
    (this._document.fullscreenElement || this._document.body).appendChild(textarea);
  }

  /**
   * 执行复制并返回是否成功。失败或浏览器不支持复制时返回 false，不抛错。
   * 副作用：复制前记录当前焦点元素，复制后还原，避免打断用户操作。
   */
  copy(): boolean {
    const textarea = this._textarea;
    let successful = false;

    try {
      // 旧浏览器在不支持复制时可能直接抛错，需整体捕获。
      if (textarea) {
        const currentFocus = this._document.activeElement as HTMLElement | SVGElement | null;

        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        successful = this._document.execCommand('copy');

        if (currentFocus) {
          currentFocus.focus();
        }
      }
    } catch {
      // 复制不可用或 execCommand 抛错时保持 false 语义。
    }

    return successful;
  }

  /**
   * 清理复制过程创建的 textarea。幂等：重复调用无副作用。
   * destroy 之后 copy() 将返回 false（textarea 已不存在）。
   */
  destroy(): void {
    const textarea = this._textarea;

    if (textarea) {
      textarea.remove();
      this._textarea = undefined;
    }
  }
}

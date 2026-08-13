import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Clipboard} from './clipboard';
import {PendingCopy} from './pending-copy';

const COPY_CONTENT = 'copy content';

/**
 * 安装 document.execCommand 桩：jsdom 未实现该方法，必须显式提供。
 * 返回值固定为 result；传入函数时按调用返回。
 */
function mockExecCommand(result: boolean | (() => boolean)): ReturnType<typeof vi.fn> {
  const spy = vi.fn(() => (typeof result === 'function' ? result() : result));
  Object.defineProperty(document, 'execCommand', {
    value: spy as unknown as typeof document.execCommand,
    configurable: true,
  });
  return spy;
}

/** 移除测试安装的 execCommand 桩，避免影响其他用例。 */
function restoreExecCommand(): void {
  delete (document as {execCommand?: unknown}).execCommand;
}

describe('Clipboard', () => {
  let clipboard: Clipboard;
  let body: HTMLElement;
  let focusedInput: HTMLElement;

  beforeEach(() => {
    clipboard = new Clipboard();
    mockExecCommand(true);
    body = document.body;
    focusedInput = document.createElement('input');
    body.appendChild(focusedInput);
    focusedInput.focus();
  });

  afterEach(() => {
    focusedInput.remove();
    restoreExecCommand();
  });

  describe('#beginCopy', () => {
    let pendingCopy: PendingCopy;

    beforeEach(() => {
      pendingCopy = clipboard.beginCopy(COPY_CONTENT);
    });

    afterEach(() => {
      pendingCopy.destroy();
    });

    it('将复制内容加载到 textarea 中', () => {
      expect(body.querySelector('textarea')!.value).toBe(COPY_CONTENT);
    });

    it('生成的 textarea 具备隐藏样式与无障碍属性', () => {
      const textarea = body.querySelector('textarea')!;
      expect(textarea.style.position).toBe('fixed');
      // jsdom 把长度值归一化为带单位形式（0px）；浏览器中读写均为 '0'。
      expect(textarea.style.top).toBe('0px');
      expect(textarea.style.opacity).toBe('0');
      expect(textarea.style.left).toBe('-999em');
      expect(textarea.getAttribute('aria-hidden')).toBe('true');
      expect(textarea.readOnly).toBe(true);
    });

    it('存在全屏元素时 textarea 插入全屏容器', () => {
      pendingCopy.destroy();
      const fullscreen = document.createElement('div');
      Object.defineProperty(document, 'fullscreenElement', {
        value: fullscreen,
        configurable: true,
      });
      try {
        const next = clipboard.beginCopy(COPY_CONTENT);
        expect(fullscreen.querySelector('textarea')?.value).toBe(COPY_CONTENT);
        next.destroy();
      } finally {
        delete (document as {fullscreenElement?: unknown}).fullscreenElement;
      }
    });

    it('destroy() 移除 textarea 且幂等', () => {
      pendingCopy.destroy();
      pendingCopy.destroy();
      expect(body.querySelector('textarea')).toBeNull();
    });
  });

  describe('#copy', () => {
    it('execCommand 成功时返回 true 并清理 textarea', () => {
      expect(clipboard.copy(COPY_CONTENT)).toBe(true);
      expect(body.querySelector('textarea')).toBeNull();
    });

    it('不移动聚焦元素的焦点', () => {
      expect(clipboard.copy(COPY_CONTENT)).toBe(true);
      expect(document.activeElement).toBe(focusedInput);
    });

    it('不移动聚焦 SVG 元素的焦点', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('focusable', 'true');
      svg.setAttribute('tabindex', '0');
      document.body.appendChild(svg);
      svg.focus();

      clipboard.copy(COPY_CONTENT);
      expect(document.activeElement).toBe(svg);
      svg.remove();
    });

    it('execCommand 抛错时返回 false', () => {
      mockExecCommand(() => {
        throw new Error('could not copy');
      });
      expect(clipboard.copy(COPY_CONTENT)).toBe(false);
    });

    it('execCommand 抛错时仍清理 textarea', () => {
      mockExecCommand(() => {
        throw new Error('could not copy');
      });
      clipboard.copy(COPY_CONTENT);
      expect(body.querySelector('textarea')).toBeNull();
    });

    it('execCommand 返回 false 时返回 false', () => {
      mockExecCommand(false);
      expect(clipboard.copy(COPY_CONTENT)).toBe(false);
    });
  });

  describe('无 document 的 SSR 环境', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('copy() 返回 false 且不抛错', () => {
      vi.stubGlobal('document', undefined);
      expect(new Clipboard().copy(COPY_CONTENT)).toBe(false);
    });

    it('beginCopy() 抛出明确错误', () => {
      vi.stubGlobal('document', undefined);
      expect(() => new Clipboard().beginCopy(COPY_CONTENT)).toThrowError(/浏览器/);
    });
  });
});

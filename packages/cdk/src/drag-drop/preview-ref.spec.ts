import {describe, expect, it} from 'vitest';
import {PreviewRef} from './preview-ref';

function rect(partial: Partial<DOMRect>): DOMRect {
  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...partial,
  } as DOMRect;
}

function createPreviewRef(options: {
  rootElement?: HTMLElement;
  template?: {render: () => HTMLElement; destroy: () => void; matchSize?: boolean};
  previewClass?: string | string[];
  rootRect?: DOMRect;
} = {}) {
  const rootElement = options.rootElement ?? document.createElement('div');
  const rootRect = options.rootRect ?? rect({left: 10, top: 20, width: 100, height: 40});
  return new PreviewRef(
    document,
    rootElement,
    'ltr',
    rootRect,
    options.template ?? null,
    options.previewClass ?? null,
    {x: 15, y: 25},
    '',
    900,
  );
}

describe('PreviewRef', () => {
  it('默认使用根元素克隆作为预览，并应用尺寸、位置与基础样式', () => {
    const root = document.createElement('div');
    root.classList.add('drag-root');
    const previewRef = createPreviewRef({rootElement: root});
    previewRef.attach(document.body);

    const preview = previewRef.element;
    expect(preview.classList.contains('vcdk-drag-preview')).toBe(true);
    expect(preview.classList.contains('drag-root')).toBe(true);
    expect(preview.style.position).toBe('fixed');
    expect(['0', '0px']).toContain(preview.style.top);
    expect(['0', '0px']).toContain(preview.style.left);
    expect(preview.style.zIndex).toBe('900');
    expect(preview.style.pointerEvents).toBe('none');
    expect(preview.style.width).toBe('100px');
    expect(preview.style.height).toBe('40px');
    expect(preview.getAttribute('dir')).toBe('ltr');
    expect(document.body.contains(preview)).toBe(true);

    previewRef.destroy();
    expect(document.body.contains(preview)).toBe(false);
  });

  it('自定义模板渲染预览且 matchSize 时对齐根元素尺寸', () => {
    const render = () => {
      const element = document.createElement('section');
      element.classList.add('custom-preview');
      element.textContent = 'custom';
      return element;
    };
    const destroy = () => undefined;
    const previewRef = createPreviewRef({template: {render, destroy, matchSize: true}});
    previewRef.attach(document.body);

    const preview = previewRef.element;
    expect(preview.classList.contains('custom-preview')).toBe(true);
    expect(preview.style.width).toBe('100px');
    expect(preview.style.height).toBe('40px');
    previewRef.destroy();
  });

  it('自定义模板且未开启 matchSize 时跟随指针位置', () => {
    const render = () => {
      const element = document.createElement('div');
      element.classList.add('custom-preview');
      return element;
    };
    const previewRef = createPreviewRef({template: {render, destroy: () => undefined}});
    previewRef.attach(document.body);

    expect(previewRef.element.style.transform).toBe('translate3d(15px, 25px, 0)');
    previewRef.destroy();
  });

  it('previewClass 追加到预览元素', () => {
    const previewRef = createPreviewRef({previewClass: ['shadow', 'rounded']});
    previewRef.attach(document.body);
    expect(previewRef.element.classList.contains('shadow')).toBe(true);
    expect(previewRef.element.classList.contains('rounded')).toBe(true);
    previewRef.destroy();
  });

  it('setTransform 更新预览位移', () => {
    const previewRef = createPreviewRef();
    previewRef.attach(document.body);
    previewRef.setTransform('translate3d(50px, 60px, 0)');
    expect(previewRef.element.style.transform).toBe('translate3d(50px, 60px, 0)');
    previewRef.destroy();
  });
});

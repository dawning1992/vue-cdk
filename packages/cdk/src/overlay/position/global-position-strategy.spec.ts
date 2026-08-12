import {describe, expect, it} from 'vitest';
import {createGlobalPositionStrategy} from './global-position-strategy';
import {createTestOverlay} from '../../../tests/helpers';

describe('GlobalPositionStrategy', () => {
  it('attach 为 host 添加全局包装类并同步 width/height', () => {
    const strategy = createGlobalPositionStrategy().width('300px').height('200px');
    const ref = createTestOverlay({positionStrategy: strategy});
    ref.attach();
    expect(ref.hostElement.classList.contains('vue-global-overlay-wrapper')).toBe(true);
    expect(ref.overlayElement.style.width).toBe('300px');
    expect(ref.overlayElement.style.height).toBe('200px');
    ref.dispose();
  });

  it('top/centerHorizontally 生成居中布局', () => {
    const strategy = createGlobalPositionStrategy().top('20px').centerHorizontally('10px');
    const ref = createTestOverlay({positionStrategy: strategy});
    ref.attach();
    strategy.apply();
    const pane = ref.overlayElement.style;
    expect(pane.position).toBe('static');
    expect(pane.marginTop).toBe('20px');
    expect(pane.marginLeft).toBe('10px');
    expect(ref.hostElement.style.justifyContent).toBe('center');
    expect(ref.hostElement.style.alignItems).toBe('flex-start');
    ref.dispose();
  });

  it('bottom/right 生成右下角布局', () => {
    const strategy = createGlobalPositionStrategy().bottom('10px').right('15px');
    const ref = createTestOverlay({positionStrategy: strategy});
    ref.attach();
    strategy.apply();
    expect(ref.overlayElement.style.marginBottom).toBe('10px');
    expect(ref.overlayElement.style.marginRight).toBe('15px');
    expect(ref.hostElement.style.justifyContent).toBe('flex-end');
    expect(ref.hostElement.style.alignItems).toBe('flex-end');
    ref.dispose();
  });

  it('RTL 下 start/end 方向镜像', () => {
    const strategy = createGlobalPositionStrategy().start('5px');
    const ref = createTestOverlay({positionStrategy: strategy, direction: 'rtl'});
    ref.attach();
    strategy.apply();
    expect(ref.hostElement.style.justifyContent).toBe('flex-start');
    expect(ref.overlayElement.style.marginRight).toBe('5px');
    ref.dispose();
  });

  it('100% 宽度时不应用水平 margin', () => {
    const strategy = createGlobalPositionStrategy().centerHorizontally();
    const ref = createTestOverlay({positionStrategy: strategy, width: '100%'});
    ref.attach();
    strategy.apply();
    expect(ref.overlayElement.style.marginLeft).toBe('0px');
    expect(ref.overlayElement.style.marginRight).toBe('0px');
    ref.dispose();
  });

  it('dispose 清理包装类与样式', () => {
    const strategy = createGlobalPositionStrategy().top().centerHorizontally();
    const ref = createTestOverlay({positionStrategy: strategy});
    ref.attach();
    strategy.apply();
    strategy.dispose();
    expect(ref.hostElement.classList.contains('vue-global-overlay-wrapper')).toBe(false);
    expect(ref.hostElement.style.justifyContent).toBe('');
    expect(ref.hostElement.style.alignItems).toBe('');
    ref.dispose();
  });
});

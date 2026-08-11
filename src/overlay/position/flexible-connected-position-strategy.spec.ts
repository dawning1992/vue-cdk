import {describe, expect, it, vi} from 'vitest';
import {
  FlexibleConnectedPositionStrategy,
  STANDARD_DROPDOWN_ADJACENT_POSITIONS,
  STANDARD_DROPDOWN_BELOW_POSITIONS,
  type ConnectedPosition,
} from './flexible-connected-position-strategy';
import {createTestOverlay, mockRect, mockViewport} from '../../../tests/helpers';

/** 构造测试环境：视口 1024x768，origin 位于 (100,100) 尺寸 200x50。 */
function setup(options: {direction?: 'ltr' | 'rtl'; attach?: boolean} = {}) {
  mockViewport(1024, 768);
  const origin = document.createElement('button');
  document.body.appendChild(origin);
  mockRect(origin, {left: 100, top: 100, width: 200, height: 50});
  const strategy = new FlexibleConnectedPositionStrategy(origin);
  const ref = createTestOverlay({positionStrategy: strategy, direction: options.direction});
  mockRect(ref.overlayElement, {width: 300, height: 200});
  if (options.attach !== false) {
    strategy.withPositions([below]).attach(ref);
  }
  return {origin, strategy, ref};
}

const below: ConnectedPosition = {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'};

describe('FlexibleConnectedPositionStrategy 校验', () => {
  it('空候选列表抛错', () => {
    const {strategy, ref} = setup({attach: false});
    expect(() => strategy.withPositions([])).toThrow(/至少需要一个候选位置/);
    ref.dispose();
    strategy.dispose();
  });

  it('非法连接点取值抛错', () => {
    const {strategy, ref} = setup({attach: false});
    expect(() =>
      strategy.withPositions([{originX: 'middle' as never, originY: 'top', overlayX: 'start', overlayY: 'top'}]),
    ).toThrow(/originX/);
    ref.dispose();
    strategy.dispose();
  });

  it('重复绑定到另一个 overlay 抛错', () => {
    const {strategy} = setup();
    const other = createTestOverlay({positionStrategy: new FlexibleConnectedPositionStrategy(document.body)});
    expect(() => strategy.attach(other)).toThrow(/已绑定/);
    other.dispose();
    strategy.dispose();
  });

  it('popover 插入点按配置返回', () => {
    const {strategy, origin} = setup();
    expect(strategy.getPopoverInsertionPoint()).toBeNull();
    strategy.withPopoverLocation('inline');
    expect(strategy.getPopoverInsertionPoint()).toBe(origin);
    const parent = document.createElement('div');
    strategy.withPopoverLocation({type: 'parent', element: parent});
    expect(strategy.getPopoverInsertionPoint()).toEqual({type: 'parent', element: parent});
    strategy.dispose();
  });
});

describe('FlexibleConnectedPositionStrategy 位置选择', () => {
  it('首选位置完整适配时直接使用，bounding box 正确约束', () => {
    const {strategy, ref} = setup();
    strategy.withPositions([below]);
    strategy.apply();
    const host = ref.hostElement.style;
    // overlayY top：top 锚定 origin.bottom(150)，高度 = 768 - 150。
    expect(host.top).toBe('150px');
    expect(host.height).toBe('618px');
    // overlayX start：left 锚定 origin.left(100)，宽度 = 1024 - 100。
    expect(host.left).toBe('100px');
    expect(host.width).toBe('924px');
    expect(host.alignItems).toBe('flex-start');
    expect(host.justifyContent).toBe('flex-start');
    // flexible 模式下 pane 使用 static 定位（由 flex 布局驱动）。
    expect(ref.overlayElement.style.position).toBe('static');
    expect(ref.overlayElement.style.transform).toBe('');
    strategy.dispose();
    ref.dispose();
  });

  it('首选位置放不下时依次尝试后续位置', () => {
    const {strategy, ref} = setup();
    mockRect(document.querySelector('button')!, {
      left: 600,
      top: 700,
      width: 200,
      height: 50,
    });
    const overflowBelow: ConnectedPosition = {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'};
    const fitsAbove: ConnectedPosition = {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'};
    strategy.withPositions([overflowBelow, fitsAbove]);
    strategy.apply();
    // 第二个位置（向上展开）完整适配：overlayY bottom → justifyContent flex-end。
    expect(ref.hostElement.style.justifyContent).toBe('flex-end');
    // 向上展开：bounding box 锚定 origin.top(700)，bottom = 768-700=68。
    expect(ref.hostElement.style.bottom).toBe('68px');
    expect(ref.hostElement.style.height).toBe('700px');
    strategy.dispose();
    ref.dispose();
  });

  it('flexible 适配按 bounding box 面积 × weight 评分', () => {
    // 需要 minWidth 才能让“水平放不下但垂直放得下”的候选进入 flexible 适配。
    const origin = document.createElement('button');
    document.body.appendChild(origin);
    mockRect(origin, {left: 700, top: 100, width: 200, height: 50});
    const strategy = new FlexibleConnectedPositionStrategy(origin);
    const ref = createTestOverlay({positionStrategy: strategy, minWidth: 100});
    mockRect(ref.overlayElement, {width: 1200, height: 200});
    const posA: ConnectedPosition = {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'};
    const posB: ConnectedPosition = {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'};

    // 默认权重：posB 的 bounding box 面积（900×618）大于 posA（324×618）。
    strategy.withPositions([posA, posB]).attach(ref);
    strategy.apply();
    expect(ref.hostElement.style.width).toBe('900px');
    expect(ref.hostElement.style.left).toBe('auto');

    // 提高 posA 权重后应改选 posA。
    strategy.withPositions([{...posA, weight: 10}, posB]);
    strategy.apply();
    expect(ref.hostElement.style.left).toBe('700px');
    expect(ref.hostElement.style.width).toBe('324px');
    strategy.dispose();
    ref.dispose();
  });

  it('全部越界且开启 push 时推回视口', () => {
    const {strategy, ref} = setup();
    mockRect(document.querySelector('button')!, {
      left: 900,
      top: 700,
      width: 200,
      height: 50,
    });
    const pos: ConnectedPosition = {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'top'};
    strategy.withPositions([pos]).withPush(true);
    strategy.apply();
    // 原始点 (800,700)，水平越界 76、垂直越界 132，推回后为 (724,568)。
    // overlayX end 时使用 right 属性：right = 1024 - (724 + 300) = 0。
    expect(ref.overlayElement.style.right).toBe('0px');
    expect(ref.overlayElement.style.top).toBe('568px');
    strategy.dispose();
    ref.dispose();
  });

  it('关闭 push 时使用越界最少的位置但保持 flexible 布局', () => {
    const {strategy, ref} = setup();
    mockRect(document.querySelector('button')!, {
      left: 900,
      top: 700,
      width: 200,
      height: 50,
    });
    const pos: ConnectedPosition = {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'top'};
    strategy.withPositions([pos]).withPush(false);
    strategy.apply();
    expect(ref.overlayElement.style.position).toBe('static');
    strategy.dispose();
    ref.dispose();
  });

  it('viewportMargin 影响位置适配判断', () => {
    const {strategy, ref} = setup();
    strategy.withPositions([below]).withViewportMargin({end: 700}).withPush(true);
    strategy.apply();
    // 右侧收窄后原位置不再适配，push 将其推回：left = 100 - 76 = 24。
    expect(ref.overlayElement.style.left).toBe('24px');
    strategy.dispose();
    ref.dispose();
  });

  it('位置偏移通过 transform 应用', () => {
    const {strategy, ref} = setup();
    strategy.withPositions([{...below, offsetX: 10, offsetY: 5}]);
    strategy.apply();
    expect(ref.overlayElement.style.transform).toBe('translateX(10px) translateY(5px)');
    strategy.dispose();
    ref.dispose();
  });

  it('默认偏移在候选位置未指定时生效', () => {
    const {strategy, ref} = setup();
    strategy
      .withPositions([below])
      .withDefaultOffsetX(8)
      .withDefaultOffsetY(3);
    strategy.apply();
    expect(ref.overlayElement.style.transform).toBe('translateX(8px) translateY(3px)');
    strategy.dispose();
    ref.dispose();
  });

  it('RTL 下 originX start 镜像为右侧', () => {
    const {strategy, ref} = setup({direction: 'rtl'});
    strategy.withPositions([below]);
    strategy.apply();
    // RTL 中 start = 右边缘 (300)；overlayX start 时向左展开，受左边缘约束。
    expect(ref.hostElement.style.right).toBe('724px');
    expect(ref.hostElement.style.width).toBe('300px');
    expect(ref.hostElement.style.left).toBe('auto');
    strategy.dispose();
    ref.dispose();
  });

  it('坐标为 origin 时按点定位', () => {
    const strategy = new FlexibleConnectedPositionStrategy({x: 50, y: 60, width: 0, height: 0});
    const ref = createTestOverlay({positionStrategy: strategy});
    mockRect(ref.overlayElement, {width: 300, height: 200});
    strategy.withPositions([below]).attach(ref);
    strategy.apply();
    expect(ref.hostElement.style.top).toBe('60px');
    expect(ref.hostElement.style.left).toBe('50px');
    strategy.dispose();
    ref.dispose();
  });
});

describe('FlexibleConnectedPositionStrategy 锁定与重定位', () => {
  it('位置锁定后重新定位沿用上次位置，且不重复派发 positionChange', () => {
    const {strategy, ref} = setup();
    const changes: unknown[] = [];
    strategy.positionChanges.subscribe(change => changes.push(change));
    const posA: ConnectedPosition = {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'};
    const posB: ConnectedPosition = {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'};
    strategy.withPositions([posA, posB]).withLockedPosition(true);
    strategy.apply();
    expect(changes).toHaveLength(1);
    expect((changes[0] as {connectionPair: ConnectedPosition}).connectionPair).toBe(posA);

    // 移动 origin 后再次 apply：仍使用 posA（连接对相同 → 不再派发）。
    mockRect(document.querySelector('button')!, {
      left: 600,
      top: 100,
      width: 200,
      height: 50,
    });
    strategy.apply();
    expect(changes).toHaveLength(1);
    expect(ref.hostElement.style.left).toBe('600px');
    strategy.dispose();
    ref.dispose();
  });

  it('reapplyLastPosition 沿用上次连接对', () => {
    const {strategy, ref} = setup();
    strategy.withPositions([below]);
    strategy.apply();
    mockRect(document.querySelector('button')!, {
      left: 300,
      top: 300,
      width: 200,
      height: 50,
    });
    strategy.reapplyLastPosition();
    expect(ref.hostElement.style.left).toBe('300px');
    expect(ref.hostElement.style.top).toBe('350px');
    strategy.dispose();
    ref.dispose();
  });

  it('positionChange 携带滚动容器可见性信息', () => {
    const {strategy, ref} = setup();
    const container = document.createElement('div');
    document.body.appendChild(container);
    mockRect(container, {left: 0, top: 0, width: 500, height: 400});
    strategy.withScrollableContainers([container]).withPositions([below]);

    let scrollVisibility: {isOverlayOutsideView: boolean; isOriginClipped: boolean} | undefined;
    strategy.positionChanges.subscribe(change => {
      scrollVisibility = change.scrollableViewProperties;
    });
    strategy.apply();
    // overlay 矩形 (100,150,300,200) 在容器 (0,0,500,400) 内。
    expect(scrollVisibility!.isOverlayOutsideView).toBe(false);
    expect(scrollVisibility!.isOriginClipped).toBe(false);

    mockRect(ref.overlayElement, {width: 300, height: 200, left: 600, top: 600});
    strategy.apply();
    expect(scrollVisibility!.isOverlayOutsideView).toBe(true);
    container.remove();
    strategy.dispose();
    ref.dispose();
  });
});

describe('FlexibleConnectedPositionStrategy transform-origin 与清理', () => {
  it('为匹配选择器的元素设置 transform-origin（LTR）', () => {
    const {strategy, ref} = setup();
    const panel = document.createElement('div');
    panel.classList.add('panel');
    ref.overlayElement.appendChild(panel);
    strategy.withPositions([below]).withTransformOriginOn('.panel');
    strategy.apply();
    expect(panel.style.transformOrigin).toBe('left top');
    strategy.dispose();
    ref.dispose();
  });

  it('RTL 下 transform-origin 镜像', () => {
    const {strategy, ref} = setup({direction: 'rtl'});
    const panel = document.createElement('div');
    panel.classList.add('panel');
    ref.overlayElement.appendChild(panel);
    strategy.withPositions([below]).withTransformOriginOn('.panel');
    strategy.apply();
    expect(panel.style.transformOrigin).toBe('right top');
    strategy.dispose();
    ref.dispose();
  });

  it('候选位置的 panelClass 会被应用与清理', () => {
    const {strategy, ref} = setup();
    strategy.withPositions([{...below, panelClass: 'position-a'}]);
    strategy.apply();
    expect(ref.overlayElement.classList.contains('position-a')).toBe(true);
    strategy.detach();
    expect(ref.overlayElement.classList.contains('position-a')).toBe(false);
    strategy.dispose();
    ref.dispose();
  });

  it('dispose 移除 bounding box 类、清理样式并结束事件流', () => {
    const {strategy, ref} = setup();
    strategy.withPositions([below]);
    strategy.apply();
    expect(ref.hostElement.classList.contains('vcdk-overlay-connected-position-bounding-box')).toBe(true);
    const listener = vi.fn();
    strategy.positionChanges.subscribe(listener);
    strategy.dispose();
    expect(ref.hostElement.classList.contains('vcdk-overlay-connected-position-bounding-box')).toBe(false);
    expect(ref.hostElement.style.top).toBe('');
    expect(ref.overlayElement.style.transform).toBe('');
    strategy.apply();
    expect(listener).not.toHaveBeenCalled();
    ref.dispose();
  });
});

describe('标准位置常量', () => {
  it('STANDARD_DROPDOWN_BELOW_POSITIONS 以向下展开优先', () => {
    expect(STANDARD_DROPDOWN_BELOW_POSITIONS[0]).toEqual({
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    });
    expect(STANDARD_DROPDOWN_BELOW_POSITIONS).toHaveLength(4);
  });

  it('STANDARD_DROPDOWN_ADJACENT_POSITIONS 在两侧水平展开', () => {
    expect(STANDARD_DROPDOWN_ADJACENT_POSITIONS[0].overlayX).toBe('start');
    expect(STANDARD_DROPDOWN_ADJACENT_POSITIONS[2].overlayX).toBe('end');
    expect(STANDARD_DROPDOWN_ADJACENT_POSITIONS).toHaveLength(4);
  });
});

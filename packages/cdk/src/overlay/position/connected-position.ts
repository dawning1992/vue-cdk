/** 文本方向。 */
export type Direction = 'ltr' | 'rtl';

/** 水平连接点。 */
export type HorizontalConnectionPos = 'start' | 'center' | 'end';

/** 垂直连接点。 */
export type VerticalConnectionPos = 'top' | 'center' | 'bottom';

/** overlay 与视口边缘的最小间距，可整体指定或按方向指定。 */
export type ViewportMargin =
  | number
  | {top?: number; bottom?: number; start?: number; end?: number};

/** 触发元素上的连接点。 */
export interface OriginConnectionPosition {
  originX: HorizontalConnectionPos;
  originY: VerticalConnectionPos;
}

/** overlay 上的连接点。 */
export interface OverlayConnectionPosition {
  overlayX: HorizontalConnectionPos;
  overlayY: VerticalConnectionPos;
}

/** 用户可配置的候选位置；weight 影响 flexible 适配时的优先度。 */
export interface ConnectedPosition {
  originX: HorizontalConnectionPos;
  originY: VerticalConnectionPos;
  overlayX: HorizontalConnectionPos;
  overlayY: VerticalConnectionPos;
  weight?: number;
  offsetX?: number;
  offsetY?: number;
  panelClass?: string | string[];
}

/** 一对连接点（触发元素 ↔ overlay），可附带偏移与位置类。 */
export class ConnectionPositionPair {
  originX: HorizontalConnectionPos;
  originY: VerticalConnectionPos;
  overlayX: HorizontalConnectionPos;
  overlayY: VerticalConnectionPos;

  constructor(
    origin: OriginConnectionPosition,
    overlay: OverlayConnectionPosition,
    public offsetX?: number,
    public offsetY?: number,
    public panelClass?: string | string[],
  ) {
    this.originX = origin.originX;
    this.originY = origin.originY;
    this.overlayX = overlay.overlayX;
    this.overlayY = overlay.overlayY;
  }
}

/** 滚动容器视角下，origin 与 overlay 的可见性状态。 */
export class ScrollingVisibility {
  isOriginClipped = false;
  isOriginOutsideView = false;
  isOverlayClipped = false;
  isOverlayOutsideView = false;
}

/** 位置切换时派发的事件载荷。 */
export class ConnectedOverlayPositionChange {
  constructor(
    public connectionPair: ConnectedPosition,
    public scrollableViewProperties: ScrollingVisibility,
  ) {}
}

/** 校验垂直连接点取值，非法时抛出明确错误。 */
export function validateVerticalPosition(
  property: string,
  value: VerticalConnectionPos,
): void {
  if (value !== 'top' && value !== 'bottom' && value !== 'center') {
    throw Error(
      `ConnectedPosition: 非法的 ${property} "${value}"，仅允许 "top"、"bottom" 或 "center"。`,
    );
  }
}

/** 校验水平连接点取值，非法时抛出明确错误。 */
export function validateHorizontalPosition(
  property: string,
  value: HorizontalConnectionPos,
): void {
  if (value !== 'start' && value !== 'end' && value !== 'center') {
    throw Error(
      `ConnectedPosition: 非法的 ${property} "${value}"，仅允许 "start"、"end" 或 "center"。`,
    );
  }
}

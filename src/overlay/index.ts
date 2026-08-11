import './styles/overlay.css';

export {Emitter} from '../emitter';

export {
  useOverlay,
  createOverlayRef,
  type CreateOverlayRefOptions,
} from './overlay';
export {OverlayConfig} from './overlay-config';
export {
  OverlayRef,
  type OverlayContent,
  type OverlayRefDeps,
  type OverlaySizeConfig,
} from './overlay-ref';
export {
  OverlayContainer,
  FullscreenOverlayContainer,
  overlayContainer,
} from './overlay-container';
export {BackdropRef} from './backdrop-ref';

export {
  OverlayKeyboardDispatcher,
  overlayKeyboardDispatcher,
} from './dispatchers/overlay-keyboard-dispatcher';
export {
  OverlayOutsideClickDispatcher,
  overlayOutsideClickDispatcher,
} from './dispatchers/overlay-outside-click-dispatcher';

export type {PositionStrategy} from './position/position-strategy';
export {
  GlobalPositionStrategy,
  createGlobalPositionStrategy,
} from './position/global-position-strategy';
export {
  FlexibleConnectedPositionStrategy,
  type FlexibleConnectedPositionStrategyDeps,
  type FlexibleConnectedPositionStrategyOrigin,
  type FlexibleOverlayPopoverLocation,
  type Point,
  type ScrollableContainer,
  STANDARD_DROPDOWN_BELOW_POSITIONS,
  STANDARD_DROPDOWN_ADJACENT_POSITIONS,
} from './position/flexible-connected-position-strategy';
export {
  OverlayPositionBuilder,
  overlayPositionBuilder,
} from './position/overlay-position-builder';
export {
  type Direction,
  type HorizontalConnectionPos,
  type VerticalConnectionPos,
  type ViewportMargin,
  type OriginConnectionPosition,
  type OverlayConnectionPosition,
  type ConnectedPosition,
  ConnectionPositionPair,
  ScrollingVisibility,
  ConnectedOverlayPositionChange,
  validateHorizontalPosition,
  validateVerticalPosition,
} from './position/connected-position';
export {isElementClippedByScrolling, isElementScrolledOutsideView} from './position/scroll-clip';

export type {ScrollStrategy} from './scroll/scroll-strategy';
export {NoopScrollStrategy, createNoopScrollStrategy} from './scroll/noop-scroll-strategy';
export {
  CloseScrollStrategy,
  createCloseScrollStrategy,
  type CloseScrollStrategyConfig,
} from './scroll/close-scroll-strategy';
export {
  BlockScrollStrategy,
  createBlockScrollStrategy,
} from './scroll/block-scroll-strategy';
export {
  RepositionScrollStrategy,
  createRepositionScrollStrategy,
  type RepositionScrollStrategyConfig,
} from './scroll/reposition-scroll-strategy';
export {scrollStrategies} from './scroll/scroll-strategy-options';

export {VOverlayOrigin, OVERLAY_ORIGIN_KEY} from './components/VOverlayOrigin';
export {VConnectedOverlay} from './components/VConnectedOverlay';

export {
  injectOverlayStyles,
  removeInjectedOverlayStyles,
  vcdkOverlayStyles,
} from './style-inject';

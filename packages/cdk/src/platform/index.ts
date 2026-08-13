/** platform 模块：平台能力检测与通用事件工具，供 SSR 环境下安全判断使用。 */
export {
  CDK_PLATFORM,
  Platform,
  createPlatform,
  getEventTarget,
  getEventTargetPierceShadowDom,
  getFocusedElementPierceShadowDom,
  getShadowRoot,
  hasModifierKey,
  isBrowser,
  normalizePassiveListenerOptions,
  platform,
  providePlatform,
  supportsPassiveEventListeners,
  supportsShadowDom,
  supportsPopover,
  usePlatform,
  type ModifierKey,
  type PlatformOptions,
} from './platform';
export {
  getRtlScrollAxisType,
  RtlScrollAxisType,
  supportsScrollBehavior,
} from './scrolling';
export {getSupportedInputTypes} from './input-types';
export {isTestEnvironment} from './test-environment';

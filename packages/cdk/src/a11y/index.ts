/**
 * a11y 模块入口，对齐 Angular CDK 的 `@angular/cdk/a11y` public-api，
 * 并新增 Vue 专属绑定（useFocusTrap / useFocusMonitor / vFocusTrap / vFocusMonitor）。
 *
 * 覆盖三个主题能力：
 * - key-manager：ListKeyManager / FocusKeyManager / ActiveDescendantKeyManager / Typeahead；
 * - focus-trap：FocusTrap / ConfigurableFocusTrap / FocusTrapManager / inert 策略 / InteractivityChecker；
 * - focus-monitor：FocusMonitor / InputModalityDetector / fake-event-detection。
 */

import {injectFocusTrapStyles} from './focus-trap/style-inject';

// 结构样式随入口自动注入（?inline）；独立的 `vue-cdk/a11y/style.css`
// 产物由构建脚本从源 css 拷贝生成。
injectFocusTrapStyles();

export * from './key-manager/typeahead';
export * from './key-manager/list-key-manager';
export * from './key-manager/focus-key-manager';
export * from './key-manager/activedescendant-key-manager';

export * from './focus-trap/interactivity-checker';
export * from './focus-trap/focus-trap';
export * from './focus-trap/focus-trap-inert-strategy';
export * from './focus-trap/focus-trap-manager';
export * from './focus-trap/configurable-focus-trap-config';
export * from './focus-trap/configurable-focus-trap';
export * from './focus-trap/configurable-focus-trap-factory';
export * from './focus-trap/event-listener-inert-strategy';
export * from './focus-trap/use-focus-trap';
export * from './focus-trap/v-focus-trap';
export * from './focus-trap/style-inject';

export * from './focus-monitor/fake-event-detection';
export * from './focus-monitor/input-modality-detector';
export * from './focus-monitor/focus-monitor';
export * from './focus-monitor/use-focus-monitor';
export * from './focus-monitor/v-focus-monitor';

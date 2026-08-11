/**
 * FocusMonitor 的组合式 API。
 *
 * 不传配置时返回全局单例；传入配置（如 EVENTUAL 检测模式）时返回
 * 独立实例，调用方需自行 destroy。组件卸载时自动销毁独立实例。
 */

import {onBeforeUnmount} from 'vue';
import {FocusMonitor, focusMonitor, type FocusMonitorOptions} from './focus-monitor';

export function useFocusMonitor(options?: FocusMonitorOptions): FocusMonitor {
  if (!options) {
    return focusMonitor;
  }

  const instance = new FocusMonitor(options);
  onBeforeUnmount(() => instance.destroy());
  return instance;
}

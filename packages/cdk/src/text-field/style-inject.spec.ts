import {afterEach, describe, expect, it} from 'vitest';
import {
  injectTextFieldStyles,
  removeInjectedTextFieldStyles,
  vcdkTextFieldStyles,
} from './style-inject';

afterEach(removeInjectedTextFieldStyles);

describe('text-field 样式', () => {
  it('幂等注入并可移除', () => {
    injectTextFieldStyles();
    injectTextFieldStyles();
    expect(document.querySelectorAll('style[data-vcdk-text-field]')).toHaveLength(1);
    removeInjectedTextFieldStyles();
    expect(document.querySelector('style[data-vcdk-text-field]')).toBeNull();
  });

  it('导出自动伸缩与自动填充探针样式', () => {
    expect(vcdkTextFieldStyles).toContain('cdk-textarea-autosize-measuring');
    expect(vcdkTextFieldStyles).toContain('cdk-text-field-autofill-start');
  });
});

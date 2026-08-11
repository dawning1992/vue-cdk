/**
 * dialog 模块入口，对齐 Angular CDK 的 `@angular/cdk/dialog` public-api，
 * 并以 Vue 组合式 API（useDialog / useDialogData / useDialogRef）提供等价能力。
 *
 * 结构样式在服务打开对话框时自动注入；也可显式引入 `vue-cdk/dialog/style.css`。
 */

export * from './dialog-config';
export * from './dialog-injectors';
export * from './dialog-ref';
export * from './dialog-container';
export * from './dialog';
export * from './style-inject';

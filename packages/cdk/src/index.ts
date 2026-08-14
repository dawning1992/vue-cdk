/**
 * Vue CDK 根入口。
 *
 * 与 Angular CDK 一致，根入口仅导出版本号；业务能力按模块子路径导入，
 * 例如 `import {useOverlay} from 'vue-cdk/overlay'`。
 *
 * version 由构建配置（define）从 package.json 注入，作为版本号的唯一事实来源；
 * 发版时只需更新 package.json，避免手工同步多处版本号造成遗漏。
 */
declare const __VUE_CDK_VERSION__: string;

export const version: string = __VUE_CDK_VERSION__;

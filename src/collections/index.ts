/**
 * collections 模块入口，对齐 Angular CDK 的 `@angular/cdk/collections` public-api。
 * 事件流使用仓库自研 Emitter，API 语义保持一致。
 */

export type {ListRange, CollectionViewer} from './collection-viewer';
export {DataSource, isDataSource} from './data-source';
export {ArrayDataSource, type ArrayDataSourceInput} from './array-data-source';

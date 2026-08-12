import type {ApiGroup} from '../api';

/** collections 模块 API 分组：数据源抽象与视图协议。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '数据源',
    rows: [
      {
        name: 'DataSource',
        signature: 'abstract class DataSource<T>',
        description:
          '数据源抽象基类：connect 返回可订阅的数据流（每次发出即表示数据集合已变化），disconnect 由消费方在销毁时调用以释放资源。同一 viewer 不应重复 connect。',
      },
      {
        name: 'ArrayDataSource',
        signature: 'class ArrayDataSource<T> extends DataSource<T>',
        description:
          '数组数据源：包装普通数组、响应式数组或 Emitter 数据流。数组在 connect 后微任务内派发一次首帧；Ref 随响应式变化持续派发（deep watch）；Emitter 直接透传。',
      },
      {
        name: 'ArrayDataSourceInput',
        signature: 'type ArrayDataSourceInput<T> = readonly T[] | Ref<readonly T[]> | Emitter<readonly T[]>',
        description: 'ArrayDataSource 可包装的三种数据形态。',
      },
      {
        name: 'isDataSource',
        signature: 'isDataSource(value: unknown): value is DataSource<unknown>',
        description: '结构判定值是否为 DataSource（存在 connect 方法即可），无需继承即可接入虚拟滚动等消费方。',
      },
    ],
  },
  {
    title: '视图协议',
    rows: [
      {
        name: 'CollectionViewer',
        signature: 'interface CollectionViewer { viewChange: Emitter<ListRange> }',
        description: '对数据集合提供视图的组件接口；viewChange 在视图查看的数据区间变化时派发。',
      },
      {
        name: 'ListRange',
        signature: 'type ListRange = { start: number; end: number }',
        description: '索引区间类型：start 含、end 不含，用于描述当前渲染的数据范围。',
      },
    ],
  },
];

import type {ApiGroup} from '../api';

/** collections 模块 API 分组：数据源抽象与视图协议。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '数据源',
    titleEn: 'Data sources',
    rows: [
      {
        name: 'DataSource',
        signature: 'abstract class DataSource<T>',
        description:
          '数据源抽象基类：connect 返回可订阅的数据流（每次发出即表示数据集合已变化），disconnect 由消费方在销毁时调用以释放资源。同一 viewer 不应重复 connect。',
        descriptionEn: 'Abstract data-source base class. connect returns a subscribable stream; each emission signals that the collection changed. Consumers must call disconnect during teardown to release resources. Do not call connect repeatedly for the same viewer.',
      },
      {
        name: 'ArrayDataSource',
        signature: 'class ArrayDataSource<T> extends DataSource<T>',
        description:
          '数组数据源：包装普通数组、响应式数组或 Emitter 数据流。数组在 connect 后微任务内派发一次首帧；Ref 随响应式变化持续派发（deep watch）；Emitter 直接透传。',
        descriptionEn: 'Array data source wrapping a plain array, reactive array, or Emitter stream. A plain array emits its initial value in a microtask after connect; a Ref emits on reactive changes through a deep watch; an Emitter is passed through directly.',
      },
      {
        name: 'ArrayDataSourceInput',
        signature: 'type ArrayDataSourceInput<T> = readonly T[] | Ref<readonly T[]> | Emitter<readonly T[]>',
        description: 'ArrayDataSource 可包装的三种数据形态。',
        descriptionEn: 'The three input shapes accepted by ArrayDataSource.',
      },
      {
        name: 'isDataSource',
        signature: 'isDataSource(value: unknown): value is DataSource<unknown>',
        description: '结构判定值是否为 DataSource（存在 connect 方法即可），无需继承即可接入虚拟滚动等消费方。',
        descriptionEn: 'Structurally checks whether a value is a DataSource by the presence of a connect method. Consumers such as virtual scrolling can accept compatible objects without inheritance.',
      },
    ],
  },
  {
    title: '视图协议',
    titleEn: 'View protocol',
    rows: [
      {
        name: 'CollectionViewer',
        signature: 'interface CollectionViewer { viewChange: Emitter<ListRange> }',
        description: '对数据集合提供视图的组件接口；viewChange 在视图查看的数据区间变化时派发。',
        descriptionEn: 'Component interface that presents a view of a collection. viewChange emits when the data range visible in the view changes.',
      },
      {
        name: 'ListRange',
        signature: 'type ListRange = { start: number; end: number }',
        description: '索引区间类型：start 含、end 不含，用于描述当前渲染的数据范围。',
        descriptionEn: 'Index range with an inclusive start and exclusive end, describing the data currently rendered.',
      },
    ],
  },
  {
    title: '选择模型',
    titleEn: 'Selection model',
    rows: [
      {
        name: 'SelectionModel',
        signature:
          'class SelectionModel<T>（constructor(multiple?, initiallySelectedValues?, emitChanges?, compareWith?)）',
        description:
          '选择模型：维护选中集合并派发变化事件。select/deselect/toggle/isSelected/setSelection/clear/sort/isEmpty/hasValue/isMultipleSelection；bulk 提供面向大批量集合的 select/deselect/setSelection 入口；changed 为 Emitter<SelectionChange>；compareWith 自定义相等比较（提供时以「等价代表值」存储）；内部 shallowRef 存储，读取 selected 可被响应式追踪。单选模式下 select/deselect/setSelection 传入多个值会抛错。',
        descriptionEn: 'Maintains the selected collection and emits changes. Provides select, deselect, toggle, isSelected, setSelection, clear, sort, isEmpty, hasValue, and isMultipleSelection; bulk exposes batch select/deselect/setSelection operations. changed is an Emitter<SelectionChange>. compareWith customizes equality and stores an equivalent representative when supplied. Internal shallowRef storage makes reads of selected reactive. In single-selection mode, passing multiple values to select, deselect, or setSelection throws.',
      },
      {
        name: 'SelectionChange',
        signature: 'interface SelectionChange<T> { source: SelectionModel<T>; added: T[]; removed: T[] }',
        description: '选择变化事件载荷：source 为派发本次变化的模型实例，added/removed 为本次新增与取消选中的值。',
        descriptionEn: 'Selection-change payload: source is the model instance that emitted the change; added and removed contain values selected and deselected in this change.',
      },
      {
        name: 'getMultipleValuesInSingleSelectionError',
        signature: 'getMultipleValuesInSingleSelectionError(): Error',
        description: '单选模式下向 select/deselect/setSelection 传入多个值时抛出的错误工厂。',
        descriptionEn: 'Error factory for passing multiple values to select, deselect, or setSelection in single-selection mode.',
      },
    ],
  },
];

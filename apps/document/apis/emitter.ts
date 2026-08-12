import type {ApiGroup} from '../api';

/** emitter 模块 API 分组：核心类。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '事件发射器',
    rows: [
      {
        name: 'Emitter',
        signature: 'class Emitter<T = void>',
        description:
          '零依赖的类型化事件发射器，语义对齐 RxJS Subject：subscribe 返回退订函数（幂等）；next 遍历订阅快照，回调中可安全退订；complete 后清空监听器并拒绝后续订阅。属性 hasListeners 可判断是否存在监听者。',
      },
    ],
  },
];

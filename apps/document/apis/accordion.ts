import type {ApiGroup} from '../api';

/** accordion 模块 API：无样式组件、组合式入口、上下文与公开类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '无样式组件', titleEn: 'Unstyled components',
    rows: [
      {
        name: 'CdkAccordion',
        signature: 'Component<{multi?: boolean; id?: string; as?: string | Component}>',
        default: 'multi=false, as="div"',
        description: '管理后代 CdkAccordionItem 的展开状态。公开实例提供 id、multi、openAll() 与 closeAll()；默认插槽获得同一 API。',
        descriptionEn: 'Manages expansion state for descendant CdkAccordionItem components. The public instance exposes id, multi, openAll(), and closeAll(); the default slot receives the same API.',
      },
      {
        name: 'CdkAccordionItem',
        signature: 'Component<{expanded?: boolean; disabled?: boolean; id?: string; as?: string | Component}>',
        default: 'expanded=false, disabled=false, as="div"',
        description: '无样式展开项。支持 v-model:expanded；默认插槽提供 id、expanded、disabled、open、close、toggle。公开实例另提供 setExpanded。',
        descriptionEn: 'An unstyled expandable item supporting v-model:expanded. The default slot exposes id, expanded, disabled, open, close, and toggle; the public instance also provides setExpanded.',
      },
      {
        name: 'CdkAccordionItem events',
        signature: 'update:expanded / expandedChange / opened / closed / destroyed',
        description: '状态真实变化时派发 expandedChange 及 opened/closed；内部操作额外派发 update:expanded；卸载时派发 destroyed。',
        descriptionEn: 'Emits expandedChange and opened/closed when state actually changes; internal operations also emit update:expanded, and unmounting emits destroyed.',
      },
    ],
  },
  {
    title: 'Composition API', titleEn: 'Composition API',
    rows: [
      {
        name: 'useAccordion',
        signature: 'useAccordion(options?: UseAccordionOptions): CdkAccordionContext',
        description: '在 setup 中创建并 provide 协调上下文，适合构建不需要包装元素的自定义组件。multi 支持 Ref、computed 或 getter。',
        descriptionEn: 'Creates and provides the coordination context in setup, suitable for custom components that do not need a wrapper element. multi accepts a Ref, computed value, or getter.',
      },
      {
        name: 'useAccordionItem',
        signature: 'useAccordionItem(options?: UseAccordionItemOptions): CdkAccordionItemPublicApi',
        description: '在 setup 中注入最近的 accordion、注册当前项并安装卸载清理。expanded 可传 Ref；直接修改该 Ref 也会参与单选协调和事件派发。',
        descriptionEn: 'Injects the nearest accordion, registers the current item, and installs unmount cleanup. expanded can be a Ref; mutating it directly participates in single-selection coordination and event dispatch.',
      },
      {
        name: 'CDK_ACCORDION',
        signature: 'InjectionKey<CdkAccordionContext | null>',
        description: '父级协调上下文注入键。项目会提供 null 边界，避免嵌套项目错误加入外层 accordion。',
        descriptionEn: 'Injection key for the parent coordination context. The library provides a null boundary so nested projects do not accidentally join an outer accordion.',
      },
    ],
  },
  {
    title: '公开类型', titleEn: 'Public types',
    rows: [
      {name: 'CdkAccordionPublicApi', signature: '{id; multi; openAll(); closeAll()}', description: 'CdkAccordion 组件实例及默认插槽的稳定公开契约。', descriptionEn: 'Stable public contract for the CdkAccordion instance and its default slot.'},
      {name: 'CdkAccordionItemPublicApi', signature: '{id; expanded; disabled; setExpanded(); open(); close(); toggle()}', description: 'CdkAccordionItem 组件实例与 useAccordionItem 的公开契约。', descriptionEn: 'Public contract shared by the CdkAccordionItem instance and useAccordionItem.'},
      {name: 'CdkAccordionItemSlotProps', signature: '{id; expanded; disabled; open; close; toggle}', description: '子项默认插槽上下文；状态字段在渲染时已解包为普通值。', descriptionEn: 'Default-slot context for an item; state fields are unwrapped to plain values during rendering.'},
    ],
  },
];


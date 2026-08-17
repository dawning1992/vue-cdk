import type {ApiGroup} from '../api';

/** accordion 模块 API：无样式组件、组合式入口、上下文与公开类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '无样式组件',
    rows: [
      {
        name: 'CdkAccordion',
        signature: 'Component<{multi?: boolean; id?: string; as?: string | Component}>',
        default: 'multi=false, as="div"',
        description: '管理后代 CdkAccordionItem 的展开状态。公开实例提供 id、multi、openAll() 与 closeAll()；默认插槽获得同一 API。',
      },
      {
        name: 'CdkAccordionItem',
        signature: 'Component<{expanded?: boolean; disabled?: boolean; id?: string; as?: string | Component}>',
        default: 'expanded=false, disabled=false, as="div"',
        description: '无样式展开项。支持 v-model:expanded；默认插槽提供 id、expanded、disabled、open、close、toggle。公开实例另提供 setExpanded。',
      },
      {
        name: 'CdkAccordionItem events',
        signature: 'update:expanded / expandedChange / opened / closed / destroyed',
        description: '状态真实变化时派发 expandedChange 及 opened/closed；内部操作额外派发 update:expanded；卸载时派发 destroyed。',
      },
    ],
  },
  {
    title: 'Composition API',
    rows: [
      {
        name: 'useAccordion',
        signature: 'useAccordion(options?: UseAccordionOptions): CdkAccordionContext',
        description: '在 setup 中创建并 provide 协调上下文，适合构建不需要包装元素的自定义组件。multi 支持 Ref、computed 或 getter。',
      },
      {
        name: 'useAccordionItem',
        signature: 'useAccordionItem(options?: UseAccordionItemOptions): CdkAccordionItemPublicApi',
        description: '在 setup 中注入最近的 accordion、注册当前项并安装卸载清理。expanded 可传 Ref；直接修改该 Ref 也会参与单选协调和事件派发。',
      },
      {
        name: 'CDK_ACCORDION',
        signature: 'InjectionKey<CdkAccordionContext | null>',
        description: '父级协调上下文注入键。项目会提供 null 边界，避免嵌套项目错误加入外层 accordion。',
      },
    ],
  },
  {
    title: '公开类型',
    rows: [
      {name: 'CdkAccordionPublicApi', signature: '{id; multi; openAll(); closeAll()}', description: 'CdkAccordion 组件实例及默认插槽的稳定公开契约。'},
      {name: 'CdkAccordionItemPublicApi', signature: '{id; expanded; disabled; setExpanded(); open(); close(); toggle()}', description: 'CdkAccordionItem 组件实例与 useAccordionItem 的公开契约。'},
      {name: 'CdkAccordionItemSlotProps', signature: '{id; expanded; disabled; open; close; toggle}', description: '子项默认插槽上下文；状态字段在渲染时已解包为普通值。'},
    ],
  },
];


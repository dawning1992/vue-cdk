/** API 文档表格的通用数据类型，各模块页面按此结构组织 API 分组。 */
export interface ApiRow {
  /** 对外导出名称，如 useOverlay。 */
  name: string;
  /** 类型签名或可读的声明摘要。 */
  signature: string;
  /** 默认值（无默认值时可省略）。 */
  default?: string;
  /** 中文说明：职责、参数/返回值语义、注意事项。 */
  description: string;
}

/** API 分组：按功能领域将同一模块的导出拆成若干表格。 */
export interface ApiGroup {
  title: string;
  rows: readonly ApiRow[];
}

/** API 行锚点：导航展示名（原始 name）与自动生成的锚点 id。 */
export interface ApiAnchorEntry {
  /** 导航展示名，多名称行（如 VDragStart / VDragRelease）原样展示。 */
  label: string;
  /** 行锚点 id，同时作为 <tr> 的 id 与跳转目标。 */
  anchor: string;
  /** 对应 API 行数据。 */
  row: ApiRow;
}

/** 分组锚点信息：分组标题锚点与组内行锚点，供右侧导航与表格渲染共用。 */
export interface ApiAnchorGroup {
  /** 分组标题（与 ApiGroup.title 一致）。 */
  title: string;
  /** 分组标题锚点 id。 */
  anchor: string;
  /** 组内行锚点信息（含原始行数据），顺序与 ApiGroup.rows 一致。 */
  items: readonly ApiAnchorEntry[];
}

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

/**
 * 树模块错误工厂，移植自 Angular CDK tree 的 tree-errors
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/** 没有合法数据源时抛出的错误。 */
export function getTreeNoValidDataSourceError(): Error {
  return Error(`A valid data source must be provided.`);
}

/** 存在多个无 when 谓词的默认节点模板时抛出的错误。 */
export function getTreeMultipleDefaultNodeDefsError(): Error {
  return Error(`There can only be one default row without a when predicate function.`);
}

/** 找不到匹配的节点模板时抛出的错误。 */
export function getTreeMissingMatchingNodeDefError(): Error {
  return Error(`Could not find a matching node definition for the provided node data.`);
}

/** 缺少 treeControl / levelAccessor / childrenAccessor 时抛出的错误。 */
export function getTreeControlMissingError(): Error {
  return Error(`Could not find a tree control, levelAccessor, or childrenAccessor for the tree.`);
}

/** 同时提供多个层级来源时抛出的错误。 */
export function getMultipleTreeControlsError(): Error {
  return Error(`More than one of tree control, levelAccessor, or childrenAccessor were provided.`);
}

/**
 * 数组操作工具，对齐 Angular CDK drag-drop 的 drag-utils。
 * 用于排序策略在拖动过程中移动/转移/复制条目，索引越界时收敛到边界值。
 */

/**
 * 在数组中把条目从 fromIndex 移动到 toIndex，其余条目按方向顺移。
 * @param array 待操作的数组（原地修改）。
 * @param fromIndex 条目的起始索引。
 * @param toIndex 条目的目标索引。
 */
export function moveItemInArray<T = any>(array: T[], fromIndex: number, toIndex: number): void {
  const from = clamp(fromIndex, array.length - 1);
  const to = clamp(toIndex, array.length - 1);

  if (from === to) {
    return;
  }

  const target = array[from];
  const delta = to < from ? -1 : 1;

  for (let i = from; i !== to; i += delta) {
    array[i] = array[i + delta];
  }

  array[to] = target;
}

/**
 * 把条目从源数组转移到目标数组（源数组移除该条目）。
 * @param currentArray 源数组。
 * @param targetArray 目标数组。
 * @param currentIndex 条目在源数组中的索引。
 * @param targetIndex 条目在目标数组中的插入索引。
 */
export function transferArrayItem<T = any>(
  currentArray: T[],
  targetArray: T[],
  currentIndex: number,
  targetIndex: number,
): void {
  const from = clamp(currentIndex, currentArray.length - 1);
  const to = clamp(targetIndex, targetArray.length);

  if (currentArray.length) {
    targetArray.splice(to, 0, currentArray.splice(from, 1)[0]);
  }
}

/**
 * 复制条目到目标数组，源数组保持不变。
 * @param currentArray 源数组。
 * @param targetArray 目标数组。
 * @param currentIndex 条目在源数组中的索引。
 * @param targetIndex 条目在目标数组中的插入索引。
 */
export function copyArrayItem<T = any>(
  currentArray: T[],
  targetArray: T[],
  currentIndex: number,
  targetIndex: number,
): void {
  const to = clamp(targetIndex, targetArray.length);

  if (currentArray.length) {
    targetArray.splice(to, 0, currentArray[currentIndex]);
  }
}

/** 把索引收敛到 [0, max] 区间。 */
function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

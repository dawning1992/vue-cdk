/**
 * portal 模块的错误构造函数。
 *
 * 六个错误与 Angular CDK portal 一一对应（null 内容、已挂载、已销毁出口、
 * 未知内容类型、null 出口、未挂载 detach）；文案使用中文，语义保持对齐。
 * 这些函数仅 @internal 供 portal 模块内部调用，不进入对外导出。
 */

/** 尝试向出口挂载 null 内容时抛出。 */
export function throwNullPortalError(): never {
  throw Error('必须提供一个 portal 才能挂载。');
}

/** 尝试向已挂载内容的出口再次挂载时抛出。 */
export function throwPortalAlreadyAttachedError(): never {
  throw Error('出口已经挂载了一个 portal。');
}

/** 尝试向已永久销毁的出口挂载时抛出。 */
export function throwPortalOutletAlreadyDisposedError(): never {
  throw Error('该 portal 出口已被销毁，不能再挂载内容。');
}

/** 出口收到无法识别的 portal 类型时抛出。 */
export function throwUnknownPortalTypeError(): never {
  throw Error(
    '未知的 Portal 类型。BasePortalOutlet 只接受 ComponentPortal、TemplatePortal 或 DomPortal。',
  );
}

/** 尝试把 portal 挂载到 null 出口时抛出。 */
export function throwNullPortalOutletError(): never {
  throw Error('尝试把 portal 挂载到一个 null 的 PortalOutlet 上。');
}

/** 尝试 detach 一个未挂载到任何出口的 portal 时抛出。 */
export function throwNoPortalAttachedError(): never {
  throw Error('尝试 detach 一个尚未挂载到出口的 portal。');
}

/**
 * 元素深克隆工具，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 */

/**
 * 深克隆元素：移除重复 id、转移 canvas 绘制内容与表单控件值，
 * 使克隆体可用作拖拽预览或占位符。
 */
export function deepCloneNode(node: HTMLElement): HTMLElement {
  const clone = node.cloneNode(true) as HTMLElement;
  const descendantsWithId = clone.querySelectorAll('[id]');
  const nodeName = node.nodeName.toLowerCase();

  clone.removeAttribute('id');

  for (let i = 0; i < descendantsWithId.length; i++) {
    descendantsWithId[i].removeAttribute('id');
  }

  if (nodeName === 'canvas') {
    transferCanvasData(node as HTMLCanvasElement, clone as HTMLCanvasElement);
  } else if (nodeName === 'input' || nodeName === 'select' || nodeName === 'textarea') {
    transferInputData(node as HTMLInputElement, clone as HTMLInputElement);
  }

  transferData('canvas', node, clone, transferCanvasData);
  transferData('input, textarea, select', node, clone, transferInputData);
  return clone;
}

/** 按选择器逐对转移源/克隆元素的数据。 */
function transferData<T extends Element>(
  selector: string,
  node: HTMLElement,
  clone: HTMLElement,
  callback: (source: T, clone: T) => void,
) {
  const descendantElements = node.querySelectorAll<T>(selector);

  if (descendantElements.length) {
    const cloneElements = clone.querySelectorAll<T>(selector);

    for (let i = 0; i < descendantElements.length; i++) {
      callback(descendantElements[i], cloneElements[i]);
    }
  }
}

// 克隆出的单选按钮 name 需要唯一，否则会破坏原按钮的选中状态。
let cloneUniqueId = 0;

/** 转移表单控件值；单选按钮 name 追加唯一后缀。 */
function transferInputData(
  source: Element & {value: string},
  clone: Element & {value: string; name: string; type: string},
) {
  if (clone.type !== 'file') {
    clone.value = source.value;
  }

  if (clone.type === 'radio' && clone.name) {
    clone.name = `vcdk-clone-${clone.name}-${cloneUniqueId++}`;
  }
}

/** 转移 canvas 像素内容（尺寸为 0 时忽略异常）。 */
function transferCanvasData(source: HTMLCanvasElement, clone: HTMLCanvasElement) {
  const context = clone.getContext('2d');

  if (context) {
    try {
      context.drawImage(source, 0, 0);
    } catch {}
  }
}

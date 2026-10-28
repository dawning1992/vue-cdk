import {isVNode} from 'vue';
import type {DialogContent} from './dialog-config';
import type {TemplateRefHandle} from '../portal/template-ref';

/** 按模板句柄契约识别内容；排除 VNode 与组件，避免把组件的 render 方法当作模板。 */
export function isDialogTemplateRef(content: DialogContent): content is TemplateRefHandle<any> {
  return typeof content === 'object' && content !== null && !isVNode(content)
    && 'render' in content && typeof content.render === 'function'
    && 'subscribe' in content && typeof content.subscribe === 'function'
    && 'appContext' in content;
}

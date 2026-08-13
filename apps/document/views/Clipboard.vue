<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/clipboard';
import CopyToClipboardDemo from '../demos/clipboard/CopyToClipboardDemo.vue';
import CopyToClipboardDemoSource from '../demos/clipboard/CopyToClipboardDemo.vue?raw';
import UseClipboardDemo from '../demos/clipboard/UseClipboardDemo.vue';
import UseClipboardDemoSource from '../demos/clipboard/UseClipboardDemo.vue?raw';
import ProvideConfigDemo from '../demos/clipboard/ProvideConfigDemo.vue';
import ProvideConfigDemoSource from '../demos/clipboard/ProvideConfigDemo.vue?raw';
import ConfigProviderSource from '../demos/clipboard/ConfigProvider.vue?raw';
import ConfigCopyButtonSource from '../demos/clipboard/ConfigCopyButton.vue?raw';
</script>

<template>
  <ModulePage
    module-name="clipboard"
    zh-name="剪贴板"
    intro="与 Angular CDK clipboard 对齐的剪贴板能力：useClipboard() / Clipboard 命令式复制、PendingCopy 延迟复制与 v-copy-to-clipboard 指令复制；长文本可通过 attempts 自动重试。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="v-copy-to-clipboard 指令复制"
      description="字符串简写只复制不关心结果；对象绑定携带 attempts 重试次数与 onCopied 回调，复制结果实时展示，可粘贴到下方验证区。"
      :source="CopyToClipboardDemoSource"
      filename="CopyToClipboardDemo.vue"
    >
      <CopyToClipboardDemo />
    </DemoCard>

    <DemoCard
      title="useClipboard() 命令式复制"
      description="copy() 同步复制适合小文本；大文本用 beginCopy() 预加载 textarea 后重试，演示 PendingCopy 的生命周期与 destroy 清理。"
      :source="UseClipboardDemoSource"
      filename="UseClipboardDemo.vue"
    >
      <UseClipboardDemo />
    </DemoCard>

    <DemoCard
      title="全局默认配置（provide）"
      description="ConfigProvider 通过 provideCopyToClipboardConfig 向其子树提供默认 attempts=3，后代指令未显式传 attempts 时自动采用；等价 App 级写法为 app.provide。"
      :source="ProvideConfigDemoSource"
      filename="ProvideConfigDemo.vue"
      :extra-sources="[
        {filename: 'ConfigProvider.vue', code: ConfigProviderSource},
        {filename: 'ConfigCopyButton.vue', code: ConfigCopyButtonSource},
      ]"
    >
      <ProvideConfigDemo />
    </DemoCard>
  </ModulePage>
</template>

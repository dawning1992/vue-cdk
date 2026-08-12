<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/drag-drop';
import BasicSortDemo from '../demos/drag-drop/BasicSortDemo.vue';
import BasicSortDemoSource from '../demos/drag-drop/BasicSortDemo.vue?raw';
import HorizontalRtlDemo from '../demos/drag-drop/HorizontalRtlDemo.vue';
import HorizontalRtlDemoSource from '../demos/drag-drop/HorizontalRtlDemo.vue?raw';
import CrossContainerDemo from '../demos/drag-drop/CrossContainerDemo.vue';
import CrossContainerDemoSource from '../demos/drag-drop/CrossContainerDemo.vue?raw';
import HandleDemo from '../demos/drag-drop/HandleDemo.vue';
import HandleDemoSource from '../demos/drag-drop/HandleDemo.vue?raw';
import CustomPreviewPlaceholderDemo from '../demos/drag-drop/CustomPreviewPlaceholderDemo.vue';
import CustomPreviewPlaceholderDemoSource from '../demos/drag-drop/CustomPreviewPlaceholderDemo.vue?raw';
import FreeDragBoundaryDemo from '../demos/drag-drop/FreeDragBoundaryDemo.vue';
import FreeDragBoundaryDemoSource from '../demos/drag-drop/FreeDragBoundaryDemo.vue?raw';
import MixedOrientationDemo from '../demos/drag-drop/MixedOrientationDemo.vue';
import MixedOrientationDemoSource from '../demos/drag-drop/MixedOrientationDemo.vue?raw';
import ConfigPredicateDemo from '../demos/drag-drop/ConfigPredicateDemo.vue';
import ConfigPredicateDemoSource from '../demos/drag-drop/ConfigPredicateDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="drag-drop"
    zh-name="拖拽"
    intro="拖拽与排序能力：VDropList + VDrag 声明式组件、vDragHandle 手柄、自定义预览/占位符插槽、跨容器传输、自动滚动与 mixed 网格排序；命令式核心对齐 Angular CDK drag-drop。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="基础纵向排序"
      description="VDropList + VDrag 实现列表排序；dropped 事件携带 previousIndex / currentIndex，配合 moveItemInArray 更新数据。"
      :source="BasicSortDemoSource"
      filename="BasicSortDemo.vue"
    >
      <BasicSortDemo />
    </DemoCard>

    <DemoCard
      title="横向排序与 RTL"
      description="orientation='horizontal' 横向拖拽；切换 dir=rtl 后视觉顺序与索引自动反转。"
      :source="HorizontalRtlDemoSource"
      filename="HorizontalRtlDemo.vue"
    >
      <HorizontalRtlDemo />
    </DemoCard>

    <DemoCard
      title="跨容器传输"
      description="两个 VDropList 通过 connectedTo（id 字符串）互联；dropped 事件提供 previousContainer / container，配合 transferArrayItem 移动数据。"
      :source="CrossContainerDemoSource"
      filename="CrossContainerDemo.vue"
    >
      <CrossContainerDemo />
    </DemoCard>

    <DemoCard
      title="自定义手柄"
      description="v-drag-handle 指令限定只有手柄可以拖拽；绑定 {disabled} 可动态禁用单个/全部手柄。"
      :source="HandleDemoSource"
      filename="HandleDemo.vue"
    >
      <HandleDemo />
    </DemoCard>

    <DemoCard
      title="自定义预览与占位符"
      description="#preview / #placeholder 插槽自定义拖拽时的预览与占位符，插槽上下文提供 data。"
      :source="CustomPreviewPlaceholderDemoSource"
      filename="CustomPreviewPlaceholderDemo.vue"
    >
      <CustomPreviewPlaceholderDemo />
    </DemoCard>

    <DemoCard
      title="自由拖拽与边界约束"
      description="脱离容器的自由拖拽：boundaryElement 限制移动范围，freeDragPosition 设置初始位置，ended 事件报告位移。"
      :source="FreeDragBoundaryDemoSource"
      filename="FreeDragBoundaryDemo.vue"
    >
      <FreeDragBoundaryDemo />
    </DemoCard>

    <DemoCard
      title="mixed 换行网格"
      description="orientation='mixed' 支持 flex-wrap 换行布局，条目通过 DOM 重排完成排序。"
      :source="MixedOrientationDemoSource"
      filename="MixedOrientationDemo.vue"
    >
      <MixedOrientationDemo />
    </DemoCard>

    <DemoCard
      title="配置项与谓词"
      description="disabled、sortingDisabled、lockAxis 与 enterPredicate 组合演示；enterPredicate 可动态拒绝条目进入列表。"
      :source="ConfigPredicateDemoSource"
      filename="ConfigPredicateDemo.vue"
    >
      <ConfigPredicateDemo />
    </DemoCard>
  </ModulePage>
</template>

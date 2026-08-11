<script setup lang="ts">
import {computed, ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const open = ref(false);
const query = ref('');
const activeIndex = ref(-1);
const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '苏州'];

const filtered = computed(() =>
  cities.filter(city => city.includes(query.value || '')),
);

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex.value =
      (activeIndex.value - 1 + filtered.value.length) % filtered.value.length;
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    query.value = filtered.value[activeIndex.value];
    open.value = false;
    activeIndex.value = -1;
  }
}

function choose(city: string) {
  query.value = city;
  open.value = false;
}
</script>

<template>
  <section :id="id" class="section">
    <h2>自动补全<span class="badge">matchWidth · 键盘导航</span></h2>
    <p class="desc">
      输入关键字过滤城市列表；<code>match-width</code> 让面板宽度与输入框一致，
      支持 ↑/↓ 选择、Enter 确认、ESC 关闭。
    </p>
    <div class="stage">
      <VOverlayOrigin>
        <input
          v-model="query"
          class="input"
          placeholder="输入城市名，如「京」"
          @focus="open = true"
          @keydown="onKeydown"
        />
        <VConnectedOverlay
          :open="open && filtered.length > 0"
          match-width
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-keydown="onKeydown"
          @overlay-outside-click="open = false"
          @update:open="open = $event"
        >
          <ul class="panel autocomplete-list">
            <li
              v-for="(city, index) in filtered"
              :key="city"
              :class="{active: index === activeIndex}"
              @mousedown.prevent="choose(city)"
            >
              {{ city }}
            </li>
            <li v-if="filtered.length === 0" class="muted">无匹配结果</li>
          </ul>
        </VConnectedOverlay>
      </VOverlayOrigin>
    </div>
  </section>
</template>

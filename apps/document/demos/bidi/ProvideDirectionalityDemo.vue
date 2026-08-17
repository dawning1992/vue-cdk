<script lang="ts">
import {defineComponent, h, ref} from 'vue';
import {provideDirectionality, useDirectionality, type Direction} from 'vue-cdk/bidi';

const DirectionConsumer = defineComponent({
  name: 'DirectionConsumer',
  setup() {
    const directionality = useDirectionality();
    return () => h('strong', directionality.valueSignal.value.toUpperCase());
  },
});

export default defineComponent({
  name: 'ProvideDirectionalityDemo',
  setup() {
    const direction = ref<Direction>('ltr');
    provideDirectionality(direction);
    return {direction, DirectionConsumer};
  },
});
</script>

<template>
  <!-- provider 组件使用 Fragment，不额外要求方向宿主元素。 -->
  <button type="button" @click="direction = direction === 'ltr' ? 'rtl' : 'ltr'">
    切换 Composition provider
  </button>
  <p>后代 useDirectionality() 读取到：<DirectionConsumer /></p>
</template>

<style scoped>
button { padding: 6px 12px; cursor: pointer; }
</style>

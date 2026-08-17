<script setup lang="ts">
import {ref} from 'vue';
import {useAutofill} from 'vue-cdk/text-field';

const input = ref<HTMLInputElement | null>(null);
const {isAutofilled} = useAutofill(input);

function toggleProbe() {
  if (!input.value) return;
  input.value.dispatchEvent(new AnimationEvent('animationstart', {
    animationName: isAutofilled.value
      ? 'cdk-text-field-autofill-end'
      : 'cdk-text-field-autofill-start',
  }));
}
</script>

<template>
  <div class="demo-stack">
    <input
      ref="input"
      class="custom-autofill"
      name="username"
      autocomplete="username"
      placeholder="自动填充时显示自定义配色"
    />
    <button type="button" @click="toggleProbe">切换 CDK 状态类</button>
    <code>.cdk-text-field-autofilled = {{ isAutofilled }}</code>
  </div>
</template>

<style scoped>
.demo-stack { display: grid; gap: 12px; max-width: 460px; }
.custom-autofill { padding: 10px 12px; border: 1px solid #94a3b8; border-radius: 8px; }
.custom-autofill.cdk-text-field-autofilled { border-color: #0f766e; background: #ccfbf1; color: #134e4a; }
.custom-autofill:-webkit-autofill { -webkit-text-fill-color: #134e4a; box-shadow: 0 0 0 1000px #ccfbf1 inset; }
button { width: fit-content; }
</style>

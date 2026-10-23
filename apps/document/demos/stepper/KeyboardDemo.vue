<script setup lang="ts">
import {computed, ref} from 'vue';
import {CdkStep, CdkStepHeader, CdkStepper} from 'vue-cdk/stepper';
import {VDir} from 'vue-cdk/bidi';
import {useLocale} from '../../composables/useLocale';
import './demo.css';
const {locale} = useLocale();
const stepper = ref<any>(); const steps = computed(() => stepper.value?.steps ?? []); const vertical = ref(false); const rtl = ref(false);
</script>
<template><VDir :dir="rtl ? 'rtl' : 'ltr'"><div class="stepper-actions"><label><input v-model="vertical" type="checkbox" /> {{ locale === 'en-US' ? 'Vertical orientation' : '垂直方向' }}</label><label><input v-model="rtl" type="checkbox" /> RTL</label></div>
  <CdkStepper ref="stepper" :orientation="vertical ? 'vertical' : 'horizontal'" class="stepper-demo">
    <nav class="stepper-headers" role="tablist" :aria-label="locale === 'en-US' ? 'Steps' : '步骤导航'" :aria-orientation="vertical ? 'vertical' : 'horizontal'"><CdkStepHeader v-for="step in steps" :key="step.id" :step="step" class="stepper-header">{{ step.label.value }}</CdkStepHeader></nav>
    <CdkStep v-for="index in 4" :key="index" v-slot="step" :label="locale === 'en-US' ? `Step ${index}` : `步骤 ${index}`"><section v-show="step.isSelected" class="stepper-panel">{{ locale === 'en-US' ? 'Use arrow keys or Home/End to move focus, then Enter/Space to select the focused step.' : '使用方向键、Home/End 移动焦点，Enter/Space 选择当前聚焦步骤。' }}</section></CdkStep>
  </CdkStepper></VDir></template>

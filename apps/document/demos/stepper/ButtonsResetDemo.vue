<script setup lang="ts">
import {computed, ref} from 'vue';
import {CdkStep, CdkStepHeader, CdkStepper, CdkStepperNext, CdkStepperPrevious, type StepControl} from 'vue-cdk/stepper';
import {useLocale} from '../../composables/useLocale';
import './demo.css';
const {locale} = useLocale();
const stepper = ref<any>(); const firstStep = ref<any>(); const steps = computed(() => stepper.value?.steps ?? []); const value = ref(locale.value === 'en-US' ? 'Initial value' : '初始值');
const initialValue = computed(() => locale.value === 'en-US' ? 'Initial value' : '初始值');
const control: StepControl = {valid: true, reset: () => { value.value = initialValue.value; }};
</script>
<template><CdkStepper ref="stepper" class="stepper-demo">
  <nav class="stepper-headers" role="tablist" :aria-label="locale === 'en-US' ? 'Steps' : '步骤导航'"><CdkStepHeader v-for="step in steps" :key="step.id" :step="step" class="stepper-header">{{ step.label.value }}</CdkStepHeader></nav>
  <CdkStep ref="firstStep" v-slot="step" :label="locale === 'en-US' ? 'Resettable step' : '可重置步骤'" :step-control="control"><section v-show="step.isSelected" class="stepper-panel"><input v-model="value" :aria-label="locale === 'en-US' ? 'Value' : '值'" /><div class="stepper-actions"><CdkStepperNext type="button">{{ locale === 'en-US' ? 'Next' : '下一步' }}</CdkStepperNext><button type="button" @click="firstStep.reset()">{{ locale === 'en-US' ? 'Reset this step only' : '仅重置本步' }}</button></div></section></CdkStep>
  <CdkStep v-slot="step" :label="locale === 'en-US' ? 'Overall actions' : '整体操作'"><section v-show="step.isSelected" class="stepper-panel">{{ locale === 'en-US' ? 'Current value: ' : '当前值：' }}{{ value }}<div class="stepper-actions"><CdkStepperPrevious>{{ locale === 'en-US' ? 'Previous' : '上一步' }}</CdkStepperPrevious><button type="button" @click="stepper.reset()">{{ locale === 'en-US' ? 'Reset entire Stepper' : '重置整个 Stepper' }}</button></div></section></CdkStep>
</CdkStepper></template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {CdkStep, CdkStepHeader, CdkStepper, CdkStepperNext, CdkStepperPrevious, type StepControl} from 'vue-cdk/stepper';
import './demo.css';
const stepper = ref<any>(); const firstStep = ref<any>(); const steps = computed(() => stepper.value?.steps ?? []); const value = ref('初始值');
const control: StepControl = {valid: true, reset: () => { value.value = '初始值'; }};
</script>
<template><CdkStepper ref="stepper" class="stepper-demo">
  <nav class="stepper-headers" role="tablist"><CdkStepHeader v-for="step in steps" :key="step.id" :step="step" class="stepper-header">{{ step.label.value }}</CdkStepHeader></nav>
  <CdkStep ref="firstStep" v-slot="step" label="可重置步骤" :step-control="control"><section v-show="step.isSelected" class="stepper-panel"><input v-model="value" /><div class="stepper-actions"><CdkStepperNext type="button">下一步</CdkStepperNext><button type="button" @click="firstStep.reset()">仅重置本步</button></div></section></CdkStep>
  <CdkStep v-slot="step" label="整体操作"><section v-show="step.isSelected" class="stepper-panel">当前值：{{ value }}<div class="stepper-actions"><CdkStepperPrevious>上一步</CdkStepperPrevious><button type="button" @click="stepper.reset()">重置整个 Stepper</button></div></section></CdkStep>
</CdkStepper></template>

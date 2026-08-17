<script setup lang="ts">
import {computed, ref} from 'vue';
import {CdkStep, CdkStepHeader, CdkStepper, CdkStepperNext, CdkStepperPrevious} from 'vue-cdk/stepper';
import './demo.css';
const stepper = ref<any>(); const steps = computed(() => stepper.value?.steps ?? []); const done = ref(false);
</script>
<template><CdkStepper ref="stepper" linear class="stepper-demo">
  <nav class="stepper-headers" role="tablist"><CdkStepHeader v-for="step in steps" :key="step.id" :step="step" class="stepper-header">{{ step.label.value }} · {{ step.indicatorType.value }}</CdkStepHeader></nav>
  <CdkStep v-slot="step" label="可选" optional><section v-show="step.isSelected" class="stepper-panel">此步骤无需完成。<div class="stepper-actions"><CdkStepperNext type="button">跳过</CdkStepperNext></div></section></CdkStep>
  <CdkStep v-slot="step" label="不可编辑" :editable="false" completed><section v-show="step.isSelected" class="stepper-panel">离开后不能返回。<div class="stepper-actions"><CdkStepperPrevious>上一步</CdkStepperPrevious><CdkStepperNext type="button">继续</CdkStepperNext></div></section></CdkStep>
  <CdkStep v-slot="step" label="显式完成" :completed="done"><section v-show="step.isSelected" class="stepper-panel"><label><input v-model="done" type="checkbox" /> 标记完成</label><div class="stepper-actions"><CdkStepperPrevious>上一步</CdkStepperPrevious></div></section></CdkStep>
</CdkStepper></template>

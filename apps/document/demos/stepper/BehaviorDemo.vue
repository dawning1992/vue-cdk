<script setup lang="ts">
import {computed, ref} from 'vue';
import {CdkStep, CdkStepHeader, CdkStepper, CdkStepperNext, type StepControl} from 'vue-cdk/stepper';
import './demo.css';
const stepper = ref<any>();
const steps = computed(() => stepper.value?.steps ?? []);
const accepted = ref(false);
const control: StepControl = {valid: accepted, reset: () => { accepted.value = false; }};
</script>
<template>
  <CdkStepper ref="stepper" linear class="stepper-demo">
    <nav class="stepper-headers" role="tablist">
      <CdkStepHeader v-for="step in steps" :key="step.id" :step="step" class="stepper-header">{{ step.label.value }}</CdkStepHeader>
    </nav>
    <CdkStep v-slot="step" label="确认条款" :step-control="control">
      <section v-show="step.isSelected" class="stepper-panel"><label><input v-model="accepted" type="checkbox" :aria-invalid="step.hasError" aria-describedby="terms-error" /> 我已确认</label><p v-if="step.hasError" id="terms-error" class="stepper-error" role="alert">请先确认条款，再进入下一步。</p><div class="stepper-actions"><CdkStepperNext type="button">下一步</CdkStepperNext></div></section>
    </CdkStep>
    <CdkStep v-slot="step" label="完成">
      <section v-show="step.isSelected" class="stepper-panel">线性 Stepper 只有在第一步有效且已交互后才能到达这里。</section>
    </CdkStep>
  </CdkStepper>
</template>

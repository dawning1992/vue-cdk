<script setup lang="ts">
import {computed, ref} from 'vue';
import {CdkStep, CdkStepHeader, CdkStepper, CdkStepperNext, CdkStepperPrevious, type StepControl} from 'vue-cdk/stepper';
import './demo.css';
const stepper = ref<any>(); const steps = computed(() => stepper.value?.steps ?? []);
const account = ref(''); const profile = ref('');
const accountControl: StepControl = {valid: computed(() => account.value.length >= 3), reset: () => { account.value = ''; }};
const profileControl: StepControl = {valid: computed(() => profile.value.length >= 2), reset: () => { profile.value = ''; }};
</script>
<template><CdkStepper ref="stepper" linear class="stepper-demo">
  <nav class="stepper-headers" role="tablist"><CdkStepHeader v-for="step in steps" :key="step.id" :step="step" class="stepper-header">{{ step.label.value }}</CdkStepHeader></nav>
  <CdkStep v-slot="step" label="账户表单" :step-control="accountControl"><form v-show="step.isSelected" class="stepper-panel" @submit.prevent><input v-model="account" minlength="3" aria-label="账户名" :aria-invalid="step.hasError" aria-describedby="account-error" /><p v-if="step.hasError" id="account-error" class="stepper-error" role="alert">账户名至少需要 3 个字符。</p><div class="stepper-actions"><CdkStepperNext>提交本步并继续</CdkStepperNext></div></form></CdkStep>
  <CdkStep v-slot="step" label="资料表单" :step-control="profileControl"><form v-show="step.isSelected" class="stepper-panel" @submit.prevent><input v-model="profile" minlength="2" aria-label="资料名称" :aria-invalid="step.hasError" aria-describedby="profile-error" /><p v-if="step.hasError" id="profile-error" class="stepper-error" role="alert">资料名称至少需要 2 个字符。</p><div class="stepper-actions"><CdkStepperPrevious>上一步</CdkStepperPrevious><CdkStepperNext>提交本步并继续</CdkStepperNext></div></form></CdkStep>
  <CdkStep v-slot="step" label="完成"><section v-show="step.isSelected" class="stepper-panel">每一步拥有独立的表单和 reset 行为。</section></CdkStep>
</CdkStepper></template>

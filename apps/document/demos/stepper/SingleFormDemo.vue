<script setup lang="ts">
import {computed, ref} from 'vue';
import {CdkStep, CdkStepHeader, CdkStepper, CdkStepperNext, CdkStepperPrevious, type StepControl} from 'vue-cdk/stepper';
import './demo.css';
const stepper = ref<any>(); const steps = computed(() => stepper.value?.steps ?? []);
const form = ref({name: '', email: ''});
const nameControl: StepControl = {valid: computed(() => !!form.value.name.trim()), reset: () => { form.value.name = ''; }};
const emailControl: StepControl = {valid: computed(() => form.value.email.includes('@')), reset: () => { form.value.email = ''; }};
</script>
<template><form @submit.prevent class="stepper-demo"><CdkStepper ref="stepper" linear>
  <nav class="stepper-headers" role="tablist"><CdkStepHeader v-for="step in steps" :key="step.id" :step="step" class="stepper-header">{{ step.label.value }}</CdkStepHeader></nav>
  <CdkStep v-slot="step" label="姓名" :step-control="nameControl"><section v-show="step.isSelected" class="stepper-panel"><input v-model="form.name" aria-label="姓名" :aria-invalid="step.hasError" aria-describedby="name-error" /><p v-if="step.hasError" id="name-error" class="stepper-error" role="alert">请输入姓名。</p><div class="stepper-actions"><CdkStepperNext type="button">下一步</CdkStepperNext></div></section></CdkStep>
  <CdkStep v-slot="step" label="邮箱" :step-control="emailControl"><section v-show="step.isSelected" class="stepper-panel"><input v-model="form.email" type="email" aria-label="邮箱" :aria-invalid="step.hasError" aria-describedby="email-error" /><p v-if="step.hasError" id="email-error" class="stepper-error" role="alert">请输入有效的邮箱地址，例如 name@example.com。</p><div class="stepper-actions"><CdkStepperPrevious>上一步</CdkStepperPrevious><CdkStepperNext type="button">下一步</CdkStepperNext></div></section></CdkStep>
  <CdkStep v-slot="step" label="提交"><section v-show="step.isSelected" class="stepper-panel">{{ form }}<div class="stepper-actions"><CdkStepperPrevious>上一步</CdkStepperPrevious><button type="submit">提交同一个表单</button></div></section></CdkStep>
</CdkStepper></form></template>

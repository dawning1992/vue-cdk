<script setup lang="ts">
import {computed, ref} from 'vue';
import {useAutofill} from 'vue-cdk/text-field';

const usernameInput = ref<HTMLInputElement | null>(null);
const passwordInput = ref<HTMLInputElement | null>(null);
const events = ref<string[]>([]);
const submitted = ref(false);

const username = useAutofill(usernameInput, {
  onAutofill(event) {
    record('用户名', event.isAutofilled);
  },
});
const password = useAutofill(passwordInput, {
  onAutofill(event) {
    record('密码', event.isAutofilled);
  },
});
const hasAutofilledField = computed(() => username.isAutofilled.value || password.isAutofilled.value);

function record(field: string, isAutofilled: boolean) {
  events.value.unshift(`${field}：${isAutofilled ? '检测到自动填充' : '自动填充状态结束'}`);
}

// 仅用于文档演示探针状态；生产环境由浏览器的 :-webkit-autofill 自动触发同名动画。
function simulate(animationName: string) {
  for (const input of [usernameInput.value, passwordInput.value]) {
    input?.dispatchEvent(new AnimationEvent('animationstart', {animationName}));
  }
}
</script>

<template>
  <div class="demo-stack">
    <form autocomplete="on" class="login-form" @submit.prevent="submitted = true">
      <label>
        用户名
        <span class="field-row">
          <input
            ref="usernameInput"
            name="username"
            type="text"
            autocomplete="username"
            placeholder="选择浏览器保存的账号"
          />
          <span class="state" :class="{active: username.isAutofilled.value}">
            {{ username.isAutofilled.value ? '已自动填充' : '未自动填充' }}
          </span>
        </span>
      </label>
      <label>
        密码
        <span class="field-row">
          <input
            ref="passwordInput"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="浏览器保存的密码"
          />
          <span class="state" :class="{active: password.isAutofilled.value}">
            {{ password.isAutofilled.value ? '已自动填充' : '未自动填充' }}
          </span>
        </span>
      </label>
      <button type="submit">登录（仅演示表单识别）</button>
    </form>

    <p v-if="submitted" class="result">演示页面不会发送账号或密码。</p>
    <p>整体状态：<strong>{{ hasAutofilledField ? '存在自动填充字段' : '没有自动填充字段' }}</strong></p>
    <div class="controls">
      <button type="button" @click="simulate('cdk-text-field-autofill-start')">模拟探针开始</button>
      <button type="button" @click="simulate('cdk-text-field-autofill-end')">模拟探针结束</button>
    </div>
    <ol class="instructions">
      <li>在 Chromium/WebKit 的密码管理器中为当前文档站域名保存一组账号密码。</li>
      <li>刷新本页，或聚焦用户名输入框并选择已保存的账号。</li>
      <li>浏览器真正应用自动填充后，字段右侧状态会自动更新。</li>
    </ol>
    <p class="note">浏览器不会因为页面存在示例就自动生成凭据；模拟按钮只用于无已保存凭据时验证 CDK 监控链路。</p>
    <ul v-if="events.length">
      <li v-for="(entry, index) in events" :key="`${entry}-${index}`">{{ entry }}</li>
    </ul>
  </div>
</template>

<style scoped>
.demo-stack { display: grid; gap: 10px; width: min(100%, 620px); }
.login-form { display: grid; gap: 12px; padding: 14px; border: 1px solid var(--doc-border); border-radius: 8px; background: #fff; }
label { display: grid; gap: 6px; }
.field-row { display: flex; gap: 10px; align-items: center; }
input { flex: 1; min-width: 0; padding: 9px 11px; }
.state { flex: 0 0 88px; color: var(--doc-muted); font-size: 12px; }
.state.active { color: #047857; font-weight: 700; }
.controls { display: flex; flex-wrap: wrap; gap: 10px; }
.instructions { margin: 0; padding-left: 20px; color: var(--doc-muted); font-size: 13px; }
.note, .result { margin: 0; color: var(--doc-muted); font-size: 13px; }
.result { color: #047857; }
ul { margin: 0; }
</style>

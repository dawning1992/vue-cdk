import {createApp} from 'vue';
import {vFocusMonitor, vFocusTrap} from 'vue-cdk/a11y';
import App from './App.vue';
import './style.css';

const app = createApp(App);

// 全局注册 a11y 指令，模板中可直接使用 v-focus-trap / v-focus-monitor。
app.directive('focus-trap', vFocusTrap);
app.directive('focus-monitor', vFocusMonitor);

app.mount('#app');

import {createApp} from 'vue';
import {vFocusMonitor, vFocusTrap} from 'vue-cdk/a11y';
import App from './App.vue';
import {router} from './router';
import './styles/main.css';

const app = createApp(App);

// 供 portal 示例演示命令式内容访问 app 级 provide（ComponentPortal 的 appContext 通道）。
app.provide('vue-cdk-doc-app', 'Vue CDK 文档站');

// 全局注册 a11y 指令，文档示例模板中可直接使用 v-focus-trap / v-focus-monitor。
app.directive('focus-trap', vFocusTrap);
app.directive('focus-monitor', vFocusMonitor);

app.use(router);
app.mount('#app');

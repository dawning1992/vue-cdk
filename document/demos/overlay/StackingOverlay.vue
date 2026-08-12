<script setup lang="ts">
import {reactive, ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

const first = ref(false);
const second = ref(false);
const log = reactive<string[]>([]);

function addLog(message: string): void {
  log.unshift(message);
  if (log.length > 6) {
    log.pop();
  }
}
</script>

<template>
  <div class="wrap">
    <p class="hint">
      两个按钮共用同一 origin：先打开第一层再点第二层不会误关第一层；键盘事件只命中栈顶的
      overlay；点击按钮以外的空白区域时，两个 overlay 都收到 outsideClick 并各自关闭。
    </p>
    <div class="row">
      <!-- 两个按钮必须共用同一 origin：VConnectedOverlay 会把“落在 origin 内部的点击”
           视为面板内点击而忽略，否则点第二层按钮会作为第一层的外部点击把它关闭。 -->
      <VOverlayOrigin>
        <button type="button" class="doc-btn" @click="first = !first; addLog('切换 第一层')">
          第一层 {{ first ? '开' : '关' }}
        </button>
        <button type="button" class="doc-btn" @click="second = !second; addLog('切换 第二层')">
          第二层 {{ second ? '开' : '关' }}
        </button>

        <!-- 第一层锚在 origin 左侧，第二层锚在右侧，两层同时打开时互不遮挡。 -->
        <VConnectedOverlay
          :open="first"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-keydown="addLog('keydown → 第一层')"
          @update:open="first = $event; addLog('ESC → 第一层关闭')"
          @overlay-outside-click="first = false; addLog('outside → 第一层关闭')"
        >
          <div class="panel">
            第一层浮层<br />
            <span class="panel-hint">按任意键看日志</span>
          </div>
        </VConnectedOverlay>

        <VConnectedOverlay
          :open="second"
          :positions="[{originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}]"
          @overlay-keydown="addLog('keydown → 第二层')"
          @update:open="second = $event; addLog('ESC → 第二层关闭')"
          @overlay-outside-click="second = false; addLog('outside → 第二层关闭')"
        >
          <div class="panel">
            第二层浮层（栈顶）<br />
            <span class="panel-hint">按任意键看日志</span>
          </div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <div class="log-panel">
        <div class="log-title">事件日志</div>
        <div v-if="log.length === 0" class="log-empty">暂无事件</div>
        <div v-for="(entry, index) in log" :key="index" class="log-entry">{{ entry }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.hint {
  margin: 0 0 12px;
  color: var(--doc-muted);
  font-size: 13px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}

.panel {
  padding: 14px 18px;
  min-width: 150px;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  box-shadow: var(--doc-shadow);
  font-size: 13px;
}

.panel-hint {
  color: var(--doc-muted);
  font-size: 12px;
}

.log-panel {
  flex: 1;
  min-width: 220px;
  padding: 12px 14px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
}

.log-title {
  margin-bottom: 6px;
  color: var(--doc-muted);
  font-size: 12px;
}

.log-empty {
  color: var(--doc-muted);
  font-size: 13px;
}

.log-entry {
  font-size: 13px;
}
</style>

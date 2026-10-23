<template>
  <div class="app-dialog-content"><slot /></div>
</template>

<style scoped>
.app-dialog-content {
  padding: 0 24px 20px;
  color: var(--doc-muted);
  font-size: 14px;
  line-height: 1.6;
}

.app-dialog-content :deep(p) {
  margin: 0;
}
</style>

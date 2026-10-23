<template>
  <footer class="app-dialog-actions"><slot /></footer>
</template>

<style scoped>
.app-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 24px 20px;
  border-top: 1px solid var(--doc-border);
}
</style>

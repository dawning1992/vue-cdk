/// <reference types="vite/client" />

/** Vite `?inline` 引入的 CSS 内容以字符串形式导出。 */
declare module '*.css?inline' {
  const css: string;
  export default css;
}

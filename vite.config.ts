import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 使用相对资源路径以支持任意静态子目录
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});

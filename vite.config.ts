import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 使用相对资源路径以支持任意静态子目录
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    // 监听所有 IPv4 地址，方便同一局域网内的手机和平板访问
    host: '0.0.0.0',
  },
});

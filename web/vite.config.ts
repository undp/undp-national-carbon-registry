import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: "default",
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: "**/*.svg",
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          "@primary-color": "#16B1FF",
          "@layout-sider-menu-container": "#F4F5FA",
          "@component-background": "#F4F5FA",
          "@layout-header-background": "#F4F5FA",
          "@layout-body-background": "#F4F5FA",
        },
        javascriptEnabled: true,
      },
    },
  },
  define: {
    global: "window",
  },
  optimizeDeps: {
    exclude: ['chunk-IFXF74NO.js', 'chunk-44HY52FL.js', 'chunk-IXXC4J32.js', 'react-circle-flags.js']
  }
});

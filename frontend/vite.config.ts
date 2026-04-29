import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
            return "vendor-react"
          }

          if (id.includes("@reduxjs/toolkit") || id.includes("react-redux") || id.includes("zustand")) {
            return "vendor-state"
          }

          if (id.includes("@headlessui/react") || id.includes("framer-motion") || id.includes("lucide-react")) {
            return "vendor-ui"
          }

          if (id.includes("axios") || id.includes("socket.io-client") || id.includes("@stripe/stripe-js") || id.includes("@stripe/react-stripe-js")) {
            return "vendor-network"
          }

          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

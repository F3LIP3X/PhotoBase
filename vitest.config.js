import { defineConfig } from 'vitest/config'

/* Standalone from electron.vite.config.mjs on purpose: that config builds
   three separate Electron targets (main/preload/renderer) and its shape
   is not what Vitest consumes. Tests run against plain Node — nothing
   here needs Electron, jsdom, or a bundler. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
})

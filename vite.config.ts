import {defineConfig} from "vite";
import {nodePolyfills} from "vite-plugin-node-polyfills";

export default defineConfig({
    mode: 'development',
    build: {
        sourcemap: true
    },
    plugins: [
        nodePolyfills() // also tried: { globals: { process: true } }
    ]
});
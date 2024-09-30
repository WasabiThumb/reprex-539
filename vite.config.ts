import {defineConfig} from "vite";
import {nodePolyfills} from "vite-plugin-node-polyfills";

// Receives BUILD_TARGET environment variable, set by package.json
const kTarget: string = "BUILD_TARGET";
let target: string = (kTarget in process.env && ((env) => {
    let val: any = env[kTarget];
    if (typeof val === "string") return val;
    return false;
})(process.env)) || "UNKNOWN";

// Standard Vite config
export default defineConfig({
    mode: 'development',
    base: target === 'PAGES' ? '/reprex-539' : '/',
    build: {
        sourcemap: true
    },
    plugins: [
        nodePolyfills() // also tried: { globals: { process: true } }
    ]
});
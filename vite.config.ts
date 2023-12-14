import react from "@vitejs/plugin-react";
import { rmSync } from "fs";
import { join } from "path";
import { defineConfig, type AliasOptions } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import pkg from "./package.json";

export default defineConfig(({ command }) => {
    rmSync("dist-main", { recursive: true, force: true });
    rmSync("dist-preload", { recursive: true, force: true });

    const isServe = command === "serve";
    const isBuild = command === "build";
    const sourcemap = isServe;

    const resolve: { alias: AliasOptions } = {
        alias: {
            "@common": join(__dirname, "src", "common"),
        },
    };

    return {
        root: "src/renderer",
        build: {
            target: "modules",
            
            outDir: "../../dist-renderer",
            rollupOptions: {
                output: {
                    esModule: true,
                    format: "esm",
                },
            },
        },
        resolve,
        plugins: [
            react(),
            electron([
                {
                    entry: "src/main/index.ts",
                    onstart(options) {
                        options.startup();
                    },
                    vite: {
                        resolve,
                        build: {
                            sourcemap,
                            target: "modules",
                            minify: false,
                            outDir: "dist-main",
                            rollupOptions: {
                                external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
                                output: {
                                    format: 'es', // ESモジュールとして出力
                                  },
                            },
                        },
                    },
                },
                {
                    entry: "src/preload/index.ts",
                    onstart(options) {
                        // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                        // instead of restarting the entire Electron App.
                        options.reload();
                    },
                    vite: {
                        resolve,

                        build: {
                            target: "modules",
                            sourcemap: sourcemap ? "inline" : undefined,
                            minify: false,
                            outDir: "dist-preload",
                            rollupOptions: {
                                external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
                                output: {
                                    format: 'es', // ESモジュールとして出力
                                  },
                            },
                        },
                    },
                },
            ]),
            renderer(),
        ],
        server: (() => ({
            host: "127.0.0.1",
            port: 7777,
        }))(),
        clearScreen: false,
    };
});

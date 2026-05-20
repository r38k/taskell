import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    outDir: "dist/js",
    dts: false,
    exports: true,
    deps: {
      alwaysBundle: [/^@taskell\/core$/, /^nanoid$/, /^neverthrow$/, /^temporal-polyfill$/],
      onlyBundle: false,
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["dist/**"],
  },
});

import { defineConfig } from "tsdown/config";

export default defineConfig({
  deps: {
    alwaysBundle: [/^@taskell\/core$/, /^nanoid$/, /^neverthrow$/, /^temporal-polyfill$/],
    onlyBundle: false,
  },
});

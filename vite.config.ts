import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      verify: {
        command:
          "vp fmt && vp run @taskell/core#build && vp lint && vp run -F '@taskell/*' test && vp run -F '@taskell/*' build",
        cache: false,
      },
      "cli:sea": {
        command: "vp run @taskell/cli#build:sea",
        cache: false,
      },
      "cli:install-local": {
        command: "mkdir -p ~/.local/bin && ln -sfn $PWD/apps/cli/dist/taskell ~/.local/bin/taskell",
        dependsOn: ["@taskell/cli#build:sea"],
        cache: false,
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});

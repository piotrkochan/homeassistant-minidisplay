import { defineConfig } from "vite";
import minifyLiterals from "rollup-plugin-html-literals";

export default defineConfig({
  base: "/",
  plugins: [
    minifyLiterals({
      include: ["**/*.ts"],
      failOnError: true,
      options: { sourceMap: false },
    }),
  ],
  esbuild: {
    // A trailing underscore marks implementation-only component members.
    // Mangling quoted names keeps Lit's reactive property metadata in sync.
    mangleProps: /_$/,
    mangleQuoted: true,
  },
  build: {
    target: "es2020",
    cssMinify: "esbuild",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});

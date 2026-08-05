import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /**
       * Il progetto non usa la pipeline immagini di Next: gira su vinext +
       * Worker Cloudflare e le sorgenti principali sono URL `blob:` creati dal
       * browser dopo un upload locale, che `next/image` non può né leggere né
       * mettere in cache. Le poche immagini statiche sono icone da 28-46 px.
       */
      "@next/next/no-img-element": "off",
    },
  },
  // Override dei default ignorati da eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

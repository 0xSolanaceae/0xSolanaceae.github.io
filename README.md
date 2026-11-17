# solanaceae

The site at [solanaceae.xyz](https://solanaceae.xyz). One static page: a canvas garden that
grows out of the word, an interactive hex-dump plate, and flora and insects drawn per viewport.
No framework, no runtime dependencies.

## Editing

Scripts are written in TypeScript in [`src/js`](./src/js). The browser loads compiled, minified
scripts from `assets/js`, which are **not** in the repository — they are generated on build.

```sh
npm ci
npm run serve       # build, then serve http://127.0.0.1:4173
npm run typecheck   # tsc --noEmit
npm run build       # src/js -> build/js -> assets/js
```

After changing anything in `src/js`, bump the `?v=` query on the script tags in `index.html`
so returning visitors pick up the new files.

CI typechecks and builds before deploying: the `assets` directory is copied into the Pages
artifact with the generated scripts in place. See
[`.github/workflows/pages.yml`](./.github/workflows/pages.yml).

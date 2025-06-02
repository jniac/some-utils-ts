# Some Utils

New iteration, one big repository is no more maintainable:

- [some-utils-ts](https://github.com/jniac/some-utils-ts)
  "Vanilla" typescript utils.

  Most notable utils are:

  - [math/basic](src/math/basic.ts)
  - [math/easing](src/math/easing/)
  - Hash
  - Observables

- [some-utils-dom](https://github.com/jniac/some-utils-dom)
  Utils for the browser.

  Most notable utils are:

  - handleXXX for handling user event listener (with unsubscription)

- [some-utils-react](https://github.com/jniac/some-utils-react)
  Utils for react.

  Most notable utils are:

  - useEffects: for handling multiple effects at once, with branching etc.

- [some-utils-three](https://github.com/jniac/some-utils-three)
  Utils for three.js

## Install

In a PNPM monorepo, inside the "packages" folder:

```
git submodule add https://github.com/jniac/some-utils-ts
git submodule add https://github.com/jniac/some-utils-three
git submodule add https://github.com/jniac/some-utils-dom
git submodule add https://github.com/jniac/some-utils-react
```

## Dev

To rebuild the dist folder after any change (dev), run:
```
pnpm dev
```

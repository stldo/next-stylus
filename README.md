# next-stylus [![npm][1]][2]

Add [Stylus][3] support to Next.js.

## Installation

```sh
npm install next-stylus stylus stylus-loader
```

## Usage

### With [next-with-plugins][4]

```js
/* next.config.js */

const withPlugins = require('next-with-plugins')

module.exports = withPlugins({
  plugins: [
    'next-stylus'
  ]
})
```

### Standalone

```js
/* next.config.js */

const withStylus = require('next-stylus')

module.exports = withStylus({
  /* Next.js config options here */
})
```

### TypeScript support

Add a reference to this module in a declaration file.

```ts
/* declarations.d.ts */

/// <reference types="next-stylus" />
```

## License

[The MIT License][license]

[1]: https://img.shields.io/npm/v/next-stylus
[2]: https://www.npmjs.com/package/next-stylus
[3]: https://github.com/stylus/stylus
[4]: https://github.com/stldo/next-with-plugins
[license]: ./LICENSE

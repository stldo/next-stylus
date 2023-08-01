const { createHash } = require('crypto')
const { basename, dirname, relative } = require('path')

const NOT_LETTER_OR_NUMBER = /[^a-z0-9]/gi
const REPLACEMENT_TAG = '|sass'

function addStylusToSassRegexp (test) {
  return new RegExp(
    test.source.replace(REPLACEMENT_TAG, `${REPLACEMENT_TAG}|styl`),
    test.flags
  )
}

function extendIssuer (rule) {
  const issuer = rule.issuer || {}

  if (issuer.source) {
    if (issuer.source.includes(REPLACEMENT_TAG)) {
      rule.issuer = addStylusToSassRegexp(rule.issuer)
    }
  } else {
    for (const operator of ['and', 'not', 'or']) {
      if (
        issuer[operator] &&
        issuer[operator].source &&
        issuer[operator].source.includes(REPLACEMENT_TAG)
      ) {
        rule.issuer[operator] = addStylusToSassRegexp(rule.issuer[operator])
      }
    }
  }
}

module.exports = config => ({
  ...config,

  webpack: (webpackConfig, ...rest) => {
    for (const rule of webpackConfig.module.rules) {
      const { oneOf } = rule

      extendIssuer(rule)

      if (!oneOf) {
        continue
      }

      for (let index = 0; index < oneOf.length; index++) {
        const rule = oneOf[index]
        const testString = String(rule.test)

        extendIssuer(rule)

        if (!testString.includes(REPLACEMENT_TAG)) {
          continue
        } else if (
          testString === '/\\.module\\.(scss|sass)$/' || // CSS Modules
          testString === '/(?<!\\.module)\\.(scss|sass)$/' // Global CSS
        ) {
          oneOf.splice(++index, 0, {
            ...rule,

            test: new RegExp(
              rule.test.source.replace('(scss|sass)', 'styl'),
              rule.test.flags
            ),

            use: rule.use
              .filter(loader => typeof loader === 'object' && loader.hasOwnProperty('loader'))
              .map(loader => {
                if (
                  testString === '/\\.module\\.(scss|sass)$/' && // CSS Modules
                  loader.loader.includes('/css-loader/')
                ) {
                  return {
                    ...loader,
                    options: {
                      ...loader.options,
                      modules: {
                        ...loader.options.modules,
                        getLocalIdent: (
                          { resourcePath, rootContext },
                          _,
                          localName
                        ) => {
                          const relativePath = relative(rootContext, resourcePath)

                          const hash = createHash('md5')
                            .update(`path:${relativePath}#className:${localName}`)
                            .digest('base64url')
                            .slice(0, 5)

                          const resourceIdent = (
                            relativePath.endsWith('/index.module.styl')
                              ? basename(dirname(relativePath))
                              : basename(relativePath).slice(0, -12)
                          ).replace(NOT_LETTER_OR_NUMBER, '_')

                          return `${resourceIdent}_${localName}__${hash}`
                        }
                      }
                    }
                  }
                } else if (loader.loader.includes('/sass-loader/')) {
                  /* Replace sass-loader with stylus-loader. */
                  return 'stylus-loader'
                }

                return loader
              })
          })
        } else if (Array.isArray(rule.test)) {
          for (let index = 0; index < rule.test.length; index++) {
            if (String(rule.test[index]).includes(REPLACEMENT_TAG)) {
              rule.test[index] = addStylusToSassRegexp(rule.test[index])
            }
          }
        } else {
          rule.test = addStylusToSassRegexp(rule.test)
        }
      }
    }

    return typeof config.webpack === 'function'
      ? config.webpack(webpackConfig, ...rest)
      : webpackConfig
  }
})

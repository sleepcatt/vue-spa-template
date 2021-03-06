require('./check-versions')()

var config = require('../config')
if (!process.env.DEV_ENV) {
  process.env.DEV_ENV = JSON.parse(config.development.env.DEV_ENV)
}

var opn = require('opn')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig =  require('./webpack.'+ process.env.DEV_ENV +'.conf');

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config[process.env.DEV_ENV].port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config[process.env.DEV_ENV].autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config[process.env.DEV_ENV].proxyTable

var app = express()
var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  logLevel: 'silent',
  headers: {
    'Cache-control': 'no-cache'
  },
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  noInfo: true,
  log: () => {
    console.log('> 浏览 ' + uri + '\n> 当前路径 ' + process.cwd() + '\n')
  }
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    typeof cb === 'function' && cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config[process.env.DEV_ENV].assetsPublicPath, config[process.env.DEV_ENV].assetsSubDirectory)
app.use(staticPath, express.static('./static'))

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> 启动开发服务器...')
devMiddleware.waitUntilValid(() => {
  console.log('> 浏览 ' + uri + '\n> 当前路径 ' + process.cwd() + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser) {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}

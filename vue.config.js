const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isProd = process.env.NODE_ENV === 'production';

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  css: { extract: false },
  configureWebpack: {
    entry: resolve('./examples/main.js'),
    externals: isProd
      ? [
          {
            axios: {
              commonjs: 'axios',
              commonjs2: 'axios',
              amd: 'axios',
              root: 'Axios'
            }
          }
        ]
      : [],
    modules: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [resolve('examples'), resolve('src')]
        }
      ]
    }
  },
  chainWebpack: config => {
    if (isProd) {
      config
        .plugin('webpack-bundle-anlyzer')
        .use(BundleAnalyzerPlugin)
        .tap(args => [
          ...args,
          {
            analyzerMode: 'static',
            reportFilename: resolve('./report.html'),
            openAnalyzer: false
          }
        ])
        .end();
    }

    return config;
  }
};

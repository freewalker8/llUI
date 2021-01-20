const { VueLoaderPlugin } = require('vue-loader');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');

const TARGET = process.env.TARGET || 'commonjs2';

let filename = 'll.common.js';

TARGET === 'umd' && (filename = 'll.umd.js');

function resolve(dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  mode: 'production',
  entry: resolve('../src/packages/index.js'),
  output: {
    library: 'll',
    libraryTarget: TARGET,
    filename,
    path: resolve('../lib')
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    modules: ['node_modules'],
    alias: {
      '@': resolve('src'),
      utils: resolve('src/packages/utils')
    }
  },
  performance: {
    hints: false
  },
  externals: [
    {
      axios: {
        commonjs: 'axios',
        commonjs2: 'axios',
        amd: 'axios',
        root: 'Axios'
      },
      'async-validator': 'async-validator',
      'async-validator/es/rule': 'async-validator/es/rule',
      'async-validator/es/util': 'async-validator/es/util'
    }
  ],
  optimization: {
    // minimize: false,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true
      })
    ]
  },
  module: [
    {
      test: /\.vue$/,
      use: ['vue-loader']
    },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@vue/babel-preset-jsx'],
          plugins: ['@babel/plugin-syntax-jsx']
        }
      }
    },
    {
      test: /\.scss$/,
      use: ['vue-style-loader', 'css-loader', 'sass-loader']
    },
    {
      test: /\.(svg|otf|ttf|woff2?|eot|git|png|jpe?g)(\?\S*)?$/,
      use: ['url-loader'],
      query: {
        limit: 10000,
        name: path.posix.join('static', '[name].[ext]')
      }
    }
  ],
  plugins: [
    new VueLoaderPlugin(),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: resolve('../report.html'),
      openAnalyzer: false
    })
  ]
};

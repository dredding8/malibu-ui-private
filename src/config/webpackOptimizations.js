/**
 * Webpack optimization configuration for production builds
 * Reduces bundle size and improves performance
 */

const path = require('path');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  optimization: {
    // Tree shaking
    usedExports: true,
    sideEffects: false,
    
    // Code splitting
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk for dependencies
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Blueprint UI components
        blueprint: {
          test: /[\\/]node_modules[\\/]@blueprintjs[\\/]/,
          name: 'blueprint',
          priority: 20,
        },
        // React and related
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          priority: 30,
        },
        // Common components
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          name: 'common',
        },
      },
    },
    
    // Minification
    minimize: true,
    
    // Module concatenation
    concatenateModules: true,
    
    // Runtime chunk
    runtimeChunk: 'single',
  },
  
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 500KB
    maxAssetSize: 256000, // 250KB
  },
  
  // Module rules for optimization
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                modules: false, // Preserve ES modules for tree shaking
                useBuiltIns: 'usage',
                corejs: 3,
              }],
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              // Remove development helpers in production
              'transform-remove-console',
              'transform-remove-debugger',
              
              // Optimize lodash imports
              'lodash',
              
              // Dynamic imports
              '@babel/plugin-syntax-dynamic-import',
              
              // Class properties
              '@babel/plugin-proposal-class-properties',
            ],
          },
        },
      },
    ],
  },
  
  // Resolve optimizations
  resolve: {
    // Only necessary extensions
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    
    // Aliases for cleaner imports
    alias: {
      '@components': path.resolve(__dirname, '../components'),
      '@utils': path.resolve(__dirname, '../utils'),
      '@hooks': path.resolve(__dirname, '../hooks'),
      '@types': path.resolve(__dirname, '../types'),
      '@mocks': path.resolve(__dirname, '../mocks'),
    },
  },
  
  // Production-only plugins
  plugins: [
    // Analyze bundle size
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html',
    }),
    
    // Compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    
    // Define production environment
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    
    // Module federation for micro-frontends (if needed)
    new ModuleFederationPlugin({
      name: 'collectionOpportunities',
      filename: 'remoteEntry.js',
      exposes: {
        './CollectionOpportunitiesHub': './src/pages/CollectionOpportunitiesHub',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        '@blueprintjs/core': { singleton: true, eager: true },
      },
    }),
  ].filter(Boolean),
};
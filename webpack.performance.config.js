const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

const smp = new SpeedMeasurePlugin();

// Performance budgets based on user impact
const performanceBudgets = {
  bundles: {
    main: 250 * 1024,        // 250KB for main bundle
    vendor: 300 * 1024,      // 300KB for vendor bundle
    lazy: 100 * 1024,        // 100KB per lazy loaded chunk
  },
  assets: {
    images: 100 * 1024,      // 100KB per image
    fonts: 50 * 1024,        // 50KB per font
  },
  metrics: {
    fcp: 1800,               // First Contentful Paint < 1.8s
    lcp: 2500,               // Largest Contentful Paint < 2.5s
    fid: 100,                // First Input Delay < 100ms
    cls: 0.1,                // Cumulative Layout Shift < 0.1
    tti: 3800,               // Time to Interactive < 3.8s
  }
};

module.exports = smp.wrap({
  performance: {
    // Enforce size limits
    maxEntrypointSize: performanceBudgets.bundles.main + performanceBudgets.bundles.vendor,
    maxAssetSize: performanceBudgets.bundles.main,
    
    hints: 'error', // Fail build on budget violations
    
    // Custom budget checking
    assetFilter: function(assetFilename) {
      // Only check JS and CSS files
      return /\.(js|css)$/.test(assetFilename);
    }
  },

  optimization: {
    // Code splitting configuration
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
          maxSize: performanceBudgets.bundles.vendor,
        },
        blueprintjs: {
          test: /[\\/]node_modules[\\/]@blueprintjs[\\/]/,
          name: 'blueprintjs',
          priority: 20,
          maxSize: 200 * 1024, // 200KB for Blueprint
        },
        common: {
          minChunks: 2,
          priority: -10,
          reuseExistingChunk: true,
          maxSize: performanceBudgets.bundles.lazy,
        },
      },
    },
    
    // Tree shaking
    usedExports: true,
    sideEffects: false,
    
    // Minification with performance focus
    minimize: true,
    minimizer: [
      // TerserPlugin with performance optimizations
      {
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: process.env.NODE_ENV === 'production',
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      },
    ],
  },

  plugins: [
    // Bundle analysis in development
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
    }),

    // Compression for production
    process.env.NODE_ENV === 'production' && new CompressionPlugin({
      test: /\.(js|css|html|svg)$/,
      threshold: 8192, // Only compress files > 8KB
      minRatio: 0.8,
    }),

    // Performance hints plugin
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('PerformanceBudgetPlugin', (compilation) => {
          const stats = compilation.getStats().toJson({
            all: false,
            assets: true,
            chunks: true,
          });

          // Check bundle sizes
          const violations = [];
          
          stats.assets.forEach(asset => {
            if (asset.name.includes('main') && asset.size > performanceBudgets.bundles.main) {
              violations.push(`Main bundle (${asset.name}): ${asset.size} bytes exceeds budget of ${performanceBudgets.bundles.main} bytes`);
            }
            if (asset.name.includes('vendor') && asset.size > performanceBudgets.bundles.vendor) {
              violations.push(`Vendor bundle (${asset.name}): ${asset.size} bytes exceeds budget of ${performanceBudgets.bundles.vendor} bytes`);
            }
          });

          // Report violations
          if (violations.length > 0) {
            console.error('\n🚨 Performance Budget Violations:');
            violations.forEach(v => console.error(`   ❌ ${v}`));
            
            // Fail build in CI
            if (process.env.CI) {
              process.exit(1);
            }
          } else {
            console.log('\n✅ All performance budgets passed!');
          }
        });
      },
    },

    // Manifest for chunk mapping
    new WebpackManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: '/',
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);

        // Add entrypoint information
        const entrypointFiles = {};
        Object.keys(entrypoints).forEach(entrypoint => {
          entrypointFiles[entrypoint] = entrypoints[entrypoint].filter(
            fileName => !fileName.endsWith('.map')
          );
        });

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
          budgets: performanceBudgets,
        };
      },
    }),
  ].filter(Boolean),

  // Module rules for optimization
  module: {
    rules: [
      {
        test: /\.(js|tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              // Enable caching for faster rebuilds
              cacheDirectory: true,
              cacheCompression: false,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
            },
          },
        ],
      },
    ],
  },
});

// Performance monitoring runtime
export const performanceMonitor = {
  init: () => {
    if ('PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log to monitoring service
          console.log(`${entry.name}: ${entry.value}ms`);
          
          // Check against budgets
          if (entry.name === 'FCP' && entry.value > performanceBudgets.metrics.fcp) {
            console.warn(`FCP violation: ${entry.value}ms > ${performanceBudgets.metrics.fcp}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    }
  },
};
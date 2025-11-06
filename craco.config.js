module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress critical dependency warning from @supabase/realtime-js
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/@supabase\/realtime-js/,
          message: /Critical dependency: the request of a dependency is an expression/,
        },
      ];
      
      return webpackConfig;
    },
  },
};
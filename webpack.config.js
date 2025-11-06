const path = require('path');

module.exports = {
  // Suppress specific warnings
  ignoreWarnings: [
    {
      module: /@supabase\/realtime-js/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
  
  // Configure webpack to handle the realtime-js dependency better
  resolve: {
    fallback: {
      "ws": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "events": false
    }
  },
  
  // Suppress deprecation warnings
  stats: {
    warningsFilter: [
      /onBeforeSetupMiddleware/,
      /onAfterSetupMiddleware/,
      /@supabase\/realtime-js/
    ]
  }
};
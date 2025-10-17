const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@/auth': path.resolve(__dirname, 'src'),
      '@/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@/emails': path.resolve(__dirname, '../../packages/react-email/emails'),
    },
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../../dist/apps/auth-services'),
  },
};

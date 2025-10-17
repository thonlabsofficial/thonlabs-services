module.exports = (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  return {
    ...config,
    target: 'node',
    externals: [],
    output: {
      ...config.output,
      filename: 'main.js',
    },
  };
};

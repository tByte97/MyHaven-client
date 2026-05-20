const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: [],
  lintOnSave: false, 
  devServer: {
    historyApiFallback: true,
  },
  chainWebpack: config => {
    
    config.plugins.delete('progress');
  }
})

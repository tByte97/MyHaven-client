const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: [],
  lintOnSave: false, 
  chainWebpack: config => {
    
    config.plugins.delete('progress');
  }
})
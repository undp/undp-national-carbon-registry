const CracoLessPlugin = require('craco-less');
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  babel: {
    loaderOptions: {
      // this option lets us display the map-pin marker layer - without this it does not work: https://github.com/visgl/react-map-gl/issues/1266
      ignore: [ './node_modules/mapbox-gl/dist/mapbox-gl.js' ],
    },
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#16B1FF',
              '@layout-sider-menu-container': '#F4F5FA',
              '@component-background': '#F4F5FA',
              '@layout-header-background': '#F4F5FA',
              '@layout-body-background': '#F4F5FA',
            },
            javascriptEnabled: true,
          },
        },
      },
    },
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          webpackConfig.optimization.minimizer.push(new TerserPlugin({ parallel: true }));
          // Define the paths for source and destination
          const localeSrcDir = path.resolve(__dirname, 'src/locales');
          const localeDestDir = path.resolve(__dirname, 'public/locales');

          // Ensure the destination directory exists, then copy the files
          if (fs.existsSync(localeSrcDir)) {
            fs.ensureDirSync(localeDestDir);
            fs.copySync(localeSrcDir, localeDestDir);
          }
          return webpackConfig;
        }
      }
    }
  ]
  
};

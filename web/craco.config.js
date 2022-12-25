const CracoLessPlugin = require('craco-less');

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
  ],
};

const json2csv = require('json2csv');
const register = (server, pluginOptions) => {
  server.ext('onRequest', (request, h) => {
    if (request.path.endsWith('.csv')) {
      request.headers.accept = 'text/csv';
      request.setUrl(request.path.replace('.csv', ''));
    }
    return h.continue;
  });
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    if (response.isBoom) {
      return h.continue;
    }
    if (request.headers.accept === 'text/csv') {
      const routeOptions = request.route.settings.plugins['hapi-transform-csv'] || {};
      // json2csv may throw an error if not formatted correctly:
      return h.response(json2csv(Object.assign({}, pluginOptions, routeOptions, response.source)));
    }
    return h.continue;
  });
};

exports.plugin = {
  name: 'hapi-transform-csv',
  register,
  once: true,
  pkg: require('./package.json')
};

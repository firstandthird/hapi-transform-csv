const qs = require('querystring');

const json2csv = require('json2csv');
const register = (server, pluginOptions) => {
  server.ext('onRequest', (request, h) => {
    if (request.path.endsWith('.csv')) {
      const query = request.query;
      request.headers.accept = 'text/csv';
      let newUrl = request.path.replace('.csv', '');
      // save the original path info:
      request.app.transformCsv = {
        originalPath: newUrl
      };
      if (Object.keys(query).length) {
        newUrl = `${newUrl}?${qs.stringify(query)}`;
      }
      request.setUrl(newUrl);
      request.query = query;
    }
    return h.continue;
  });
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    if (response.isBoom || response.statusCode !== 200) {
      // if this was originally a .csv request and it got redirected,
      // add back the .csv before returning it
      if (request.app.transformCsv && [301, 302].includes(response.statusCode)) {
        const originalPath = request.app.transformCsv.originalPath;
        response.headers.location = response.headers.location.replace(originalPath, `${originalPath}.csv`);
      }
      return h.continue;
    }
    if (request.headers.accept === 'text/csv') {
      const input = Object.assign({}, pluginOptions, request.route.settings.plugins['hapi-transform-csv'] || {});
      input.data = response.source;
      if (pluginOptions.map) {
        pluginOptions.map(input);
      }
      // json2csv may throw an error if not formatted correctly:
      return h.response(json2csv(input)).type('text/csv');
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

const Hapi = require('hapi');
const tap = require('tap');
const plugin = require('../index');
const fs = require('fs');
const path = require('path');

tap.test('can configure a route to return csv instead of json', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/normal',
    handler(request, h) {
      return [
        {
          car: 'Audi',
          price: 40000,
          color: 'blue'
        }, {
          car: 'BMW',
          price: 35000,
          color: 'black'
        }, {
          car: 'Porsche',
          price: 60000,
          color: 'green'
        }
      ];
    }
  });

  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        'hapi-transform-csv': {
        }
      }
    },
    handler(request, h) {
      return [
        {
          car: 'Audi',
          price: 40000,
          color: 'blue'
        }, {
          car: 'BMW',
          price: 35000,
          color: 'black'
        }, {
          car: 'Porsche',
          price: 60000,
          color: 'green'
        }
      ];
    }
  });
  await server.register(plugin, {});
  await server.start();
  const csvResponse = await server.inject({
    method: 'get',
    url: '/path1.csv'
  });
  t.equal(csvResponse.statusCode, 200, 'returns HTTP OK');
  t.equal(typeof csvResponse.result, 'string', 'returns a string value');
  t.equal(csvResponse.result, fs.readFileSync(path.join(__dirname, 'output1.txt'), 'utf-8'), 'returns correct output');
  t.equal(csvResponse.headers['content-type'], 'text/csv; charset=utf-8');
  const jsonResponse = await server.inject({
    method: 'get',
    url: '/normal'
  });
  t.equal(jsonResponse.statusCode, 200, 'returns HTTP OK');
  t.deepEqual(jsonResponse.result, [
    {
      car: 'Audi',
      price: 40000,
      color: 'blue'
    }, {
      car: 'BMW',
      price: 35000,
      color: 'black'
    }, {
      car: 'Porsche',
      price: 60000,
      color: 'green'
    }
  ], 'json returns the original json values');
  await server.stop();
  t.end();
});

tap.test('will pass config options to json2csv', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        'hapi-transform-csv': {
          quotes: '$'
        }
      }
    },
    handler(request, h) {
      return [
        {
          car: 'Audi',
          price: 40000,
          color: 'blue'
        }, {
          car: 'BMW',
          price: 35000,
          color: 'black'
        }, {
          car: 'Porsche',
          price: 60000,
          color: 'green'
        }
      ];
    }
  });
  await server.register({ plugin, options: { del: '_' } });
  await server.start();
  const csvResponse = await server.inject({
    method: 'get',
    url: '/path1.csv'
  });
  t.equal(csvResponse.statusCode, 200, 'returns HTTP OK');
  t.equal(csvResponse.result, fs.readFileSync(path.join(__dirname, 'output2.txt'), 'utf-8'), 'returns correct output');
  await server.stop();
  t.end();
});

tap.test('will not interfere with non-200 results', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        'hapi-transform-table': {}
      }
    },
    handler(request, h) {
      return h.response('hello there').code(204);
    }
  });
  await server.register({ plugin, options: { excludeSubArrays: true } });
  await server.start();
  const tableResponse = await server.inject({
    method: 'get',
    url: '/path1.csv'
  });
  t.equal(tableResponse.statusCode, 204, 'returns HTTP 204');
  await server.stop();
  t.end();
});

tap.test('will forward query params to the underlying route', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1',
    config: {
      plugins: {
        'hapi-transform-csv': {
        }
      }
    },
    handler(request, h) {
      t.equal(request.query.test, '1', 'query param forwarded');
      return [
        {
          car: 'Audi',
          price: 40000,
          color: 'blue'
        }, {
          car: 'BMW',
          price: 35000,
          color: 'black'
        }, {
          car: 'Porsche',
          price: 60000,
          color: 'green'
        }
      ];
    }
  });
  await server.register(plugin, {});
  await server.start();
  const csvResponse = await server.inject({
    method: 'get',
    url: '/path1.csv?test=1'
  });
  t.equal(csvResponse.statusCode, 200, 'returns HTTP OK');
  await server.stop();
  t.end();
});

tap.test('auth schemes that do redirects will preserve the original .csv route', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  await server.register(plugin, {});
  await server.register({
    plugin: require('hapi-password'),
    options: {
      salt: 'aSalt',
      password: 'password',
      cookieName: 'demo-login'
    }
  });
  server.route({
    method: 'GET',
    path: '/success',
    config: {
      plugins: {
        'hapi-transform-table': {}
      },
      handler: (request, h) => 'success!'
    }
  });
  await server.start();
  const redirectResponse = await server.inject({ url: '/success.csv' });
  t.equal(redirectResponse.statusCode, 302);
  t.equal(redirectResponse.headers.location, '/login?next=/success.csv');
  await server.stop();
  t.end();
});

const Hapi = require('hapi');
const tap = require('tap');
const plugin = require('../index');

tap.test('can configure a route to return csv instead of json', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/normal',
    handler(request, h) {
      return {
        fields: ['car', 'price', 'color'],
        data: [
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
        ]
      };
    }
  });

  server.route({
    method: 'get',
    path: '/path1.csv',
    config: {
      plugins: {
        'hapi-transform-csv': {
        }
      }
    },
    handler(request, h) {
      return {
        fields: ['car', 'price', 'color'],
        data: [
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
        ]
      };
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
  const rows = csvResponse.result.split('\n');
  t.notEqual(rows[0].indexOf('car'), -1, 'top row of csv is the headers');
  t.notEqual(rows[0].indexOf('price'), -1, 'top row of csv is the headers');
  t.notEqual(rows[0].indexOf('color'), -1, 'top row of csv is the headers');
  const jsonResponse = await server.inject({
    method: 'get',
    url: '/normal'
  });
  t.equal(jsonResponse.statusCode, 200, 'returns HTTP OK');
  t.deepEqual(jsonResponse.result, {
    fields: ['car', 'price', 'color'],
    data: [
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
    ]
  }, 'json returns the original json values');
  await server.stop();
  t.end();
});

tap.test('will pass config options to json2csv', async(t) => {
  const server = await new Hapi.Server({ port: 8080 });
  server.route({
    method: 'get',
    path: '/path1.csv',
    config: {
      plugins: {
        'hapi-transform-csv': {
        }
      }
    },
    handler(request, h) {
      return {
        fields: ['car', 'price', 'color'],
        data: [
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
        ]
      };
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
  await server.stop();
  t.end();
});

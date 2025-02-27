/*
MIT License

Copyright (c) 2020 John Gilbert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import Connector from '../connectors/dynamodb';
import ThingModel from '../models/thing';
import ElementModel from '../models/element';
import {
  queryMetrics, getMetric, saveMetric, deleteMetric,
} from './routes/thing';
import {
  saveElement, deleteElement,
} from './routes/element';
import {
  debug,
  cors,
  getClaims/* , forRole */,
  errorHandler,
  // serializer,
} from '../utils';

const api = require('lambda-api')({
  // isBase64: true,
  // headers: {
  //   'content-encoding': ['gzip'],
  // },
  // serializer: (body) => serializer(body),
  logger: {
    level: 'trace',
    access: true,
    detail: true,
    stack: true,
  },
});

const models = (req, res, next) => {
  const claims = getClaims(req.requestContext);
  const connector = new Connector(
    req.namespace.debug,
    process.env.ENTITY_TABLE_NAME,
  );

  api.app({
    debug: req.namespace.debug,
    models: {
      metric: new ThingModel({
        debug: req.namespace.debug,
        connector,
        claims,
      }),
      element: new ElementModel({
        debug: req.namespace.debug,
        connector,
        claims,
      }),
    },
  });

  return next();
};

api.use(cors);
api.use(debug(api));
api.use(errorHandler);
api.use(models);

['', `/api-${process.env.PROJECT}`]
  .forEach((prefix) => api.register((api) => { // eslint-disable-line no-shadow
    api.get('/metrics', queryMetrics);
    api.get('/metrics/:id', getMetric);
    api.put('/metrics/:id', /* forRole('power'), */ saveMetric);
    api.delete('/metrics/:id', /* forRole('admin'), */ deleteMetric);
    api.put('/metrics/:id/elements/:elementId', /* forRole('power'), */ saveElement);
    api.delete('/metrics/:id/elements/:elementId', /* forRole('admin'), */ deleteElement);
  }, { prefix }));

// eslint-disable-next-line import/prefer-default-export
export const handle = async (event, context) => api.run(event, context);

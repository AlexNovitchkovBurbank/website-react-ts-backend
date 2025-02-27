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

import _omit from 'lodash/omit';

export const sortKeyTransform = (v) => v.split('|')[1];

export const deletedFilter = (i) => !i.deleted;

export const DEFAULT_OMIT_FIELDS = [
  'pk',
  'sk',
  'data',
  'data2',
  'data3',
  'data4',
  'discriminator',
  'ttl',
  'latched',
  'deleted',
  'pull',
  'awsregion',
  'aws:rep:updateregion',
  'aws:rep:updatetime',
  'aws:rep:deleting',
  'eem',
];

export const DEFAULT_RENAME = { pk: 'id' };

export const mapper = ({
  defaults = {},
  rename = DEFAULT_RENAME,
  omit = DEFAULT_OMIT_FIELDS,
  transform = {},
} = {}) => async (o, ctx = {}) => {
  const transformed = {
    ...o,
    ...(await Object.keys(transform).reduce(async (a, k) => {
      a = await a;
      if (o[k]) a[k] = await transform[k](o[k], ctx);
      return a;
    }, {})),
  };

  const renamed = {
    ...o,
    ...Object.keys(rename).reduce((a, k) => {
      if (transformed[k]) a[rename[k]] = transformed[k];
      return a;
    }, {}),
  };

  return ({
    ...defaults,
    ..._omit(renamed, omit),
  });
};

// https://advancedweb.hu/how-to-use-async-functions-with-array-reduce-in-javascript/

export const aggregateMapper = ({
  aggregate,
  cardinality,
  mappers,
  delimiter = '|',
}) => async (items, ctx = {}) => items
  .filter(deletedFilter)
  .reduce(async (a, c) => {
    a = await a;
    const mappings = mappers[c.discriminator] || /* istanbul ignore next */ (async (o) => o);
    const mapped = await mappings(c, ctx);

    if (c.discriminator === aggregate) {
      return {
        ...mapped,
        ...a,
      };
    } else {
      const role = c.sk.split(delimiter)[0];
      if (!a[role]) {
        if (cardinality[role] > 1) {
          a[role] = [mapped];
        } else {
          a[role] = mapped;
        }
      } else {
        a[role].push(mapped);
      }

      return a;
    }
  }, {});

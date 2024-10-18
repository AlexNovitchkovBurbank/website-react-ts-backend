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

import {
  now, ttl, mapper, sortKeyTransform,
} from '../utils';

export const DISCRIMINATOR = 'element';
export const ALIAS = 'elements';

export const MAPPER = mapper({
  transform: { sk: sortKeyTransform },
  rename: {
    sk: 'id',
  },
});

class Model {
  constructor({
    connector,
    debug,
    claims = { username: 'system' },
  } = {}) {
    this.claims = claims;
    this.debug = debug;
    this.connector = connector;
  }

  save({ id, elementId }, element) {
    const timestamp = now();
    return this.connector.update(
      {
        pk: id,
        sk: `${ALIAS}|${elementId}`,
      },
      {
        timestamp,
        lastModifiedBy: this.claims.username,
        ...element,
        discriminator: DISCRIMINATOR,
        deleted: null,
        latched: null,
        ttl: ttl(timestamp, 66),
        awsregion: process.env.AWS_REGION,
      },
    );
  }

  delete({ id, elementId }) {
    const timestamp = now();
    return this.connector.update(
      {
        pk: id,
        sk: `${ALIAS}|${elementId}`,
      },
      {
        discriminator: DISCRIMINATOR,
        deleted: true,
        lastModifiedBy: this.claims.username,
        latched: null,
        ttl: ttl(timestamp, 11),
        timestamp,
        awsregion: process.env.AWS_REGION,
      },
    );
  }
}

export default Model;

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

import { updateExpression, timestampCondition } from '@alexnovitchkovburbank/custom-jgilbert-package';
import invert from 'lodash/invert';

import {
  now, ttl, deletedFilter, aggregateMapper, mapper,
} from '../utils';

import * as Element from './element';

export const DISCRIMINATOR = 'metric';

export const MAPPER = mapper();

const AGGREGATE_MAPPER = aggregateMapper({
  aggregate: DISCRIMINATOR,
  cardinality: {
    [Element.ALIAS]: 999,
  },
  mappers: {
    [DISCRIMINATOR]: MAPPER,
    [Element.DISCRIMINATOR]: Element.MAPPER,
  },
});

class Model {
  constructor({
    debug,
    connector,
    claims = { username: 'system' },
  } = {}) {
    this.debug = debug;
    this.connector = connector;
    this.claims = claims;
  }

  query({ last, limit /* more params here */ }) {
    return this.connector
      .query({
        index: 'gsi1',
        keyName: 'discriminator',
        keyValue: DISCRIMINATOR,
        last,
        limit,
      })
      .then(async (response) => ({
        ...response,
        data: await Promise.all(response.data
          .filter(deletedFilter)
          .map((e) => MAPPER(e))),
      }));
  }

  get(id) {
    return this.connector.get(id)
      .then((data) => AGGREGATE_MAPPER(data));
  }

  save(id, input) {
    if (input === null)
      throw new Error("input is null");
    const { elements, ...metric } = input;
    const timestamp = now();
    const lastModifiedBy = this.claims.username;
    const deleted = null;
    const latched = null;
    const _ttl = ttl(timestamp, 33);
    const awsregion = process.env.AWS_REGION;

    return this.connector.batchUpdate([
      {
        key: {
          pk: id,
          sk: DISCRIMINATOR,
        },
        inputParams: {
          ...metric,
          discriminator: DISCRIMINATOR,
          timestamp,
          lastModifiedBy,
          deleted,
          latched,
          ttl: _ttl,
          awsregion,
        },
      },
      // elements are optional
      // they can be added/updated here but not deleted
      // they must be deleted individually
      ...(elements || []).map((d) => {
        const { id: elementId, ...element } = d;

        return {
          key: {
            pk: id.toString(),
            sk: `${Element.ALIAS}|${elementId}`,
          },
          inputParams: {
            lastModifiedBy,
            timestamp,
            ...element,
            discriminator: Element.DISCRIMINATOR,
            deleted,
            latched,
            ttl: _ttl,
            awsregion,
          },
        };
      }),
    ]);
  }

  delete(id) {
    const timestamp = now();
    return this.connector.update(
      {
        pk: id,
        sk: DISCRIMINATOR,
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

const STATUS_EVENT_MAP = {
  SUBMITTED: 'metric-submitted',
  RESUBMITTED: 'metric-resubmitted',
  REJECTED: 'metric-rejected',
  APPROVED: 'metric-approved',
};

const EVENT_STATUS_MAP = invert(STATUS_EVENT_MAP);

const OUTCOME_STATUS_MAP = {
  resubmitted: 'RESUBMITTED',
  rejected: 'REJECTED',
  approved: 'APPROVED',
};

export const toUpdateRequest = (uow) => ({
  Key: {
    pk: uow.event.id,
    sk: DISCRIMINATOR,
  },
  ...updateExpression({
    ...uow.event,
    status: EVENT_STATUS_MAP[uow.event.type] /*|| uow.event.status*/,
    discriminator: DISCRIMINATOR,
    lastModifiedBy: uow.event.lastModifiedBy || 'system',
    timestamp: uow.event.timestamp,
    deleted: uow.event.type === 'metric-deleted' ? true : null,
    latched: true,
    ttl: ttl(uow.event.sendTimestamp, 33),
    awsregion: process.env.AWS_REGION,
  }),
  ...timestampCondition(),
});

export const toMessage = /* async */(uow) => {
  const data = uow.event.raw.new || /* istanbul ignore next */ uow.event.raw.old;
  //const records = uow.queryResponse.map((r) => (r.discriminator === DISCRIMINATOR ? data : r));
  //const metric = await AGGREGATE_MAPPER(records);
  return {
    type: uow.event.type,
    // type: uow.event.type === 'metric-deleted'
    //   ? /* istanbul ignore next */ uow.event.type
    //   : STATUS_EVENT_MAP[data.status] || /* istanbul ignore next */ uow.evebt.type,
    timestamp: data.timestamp || uow.event.timestamp,
    data,
    //metric,
    raw: undefined,
  };
};


// export const toMessage = /* async */(uow) => {
//   const data = uow.event.raw.new || /* istanbul ignore next */ uow.event.raw.old;
//   //const records = uow.queryResponse.map((r) => (r.discriminator === DISCRIMINATOR ? data : r));
//   //const metric = await AGGREGATE_MAPPER(records);
//   return {
//     type: uow.event.type,
//     // type: uow.event.type === 'metric-deleted'
//     //   ? /* istanbul ignore next */ uow.event.type
//     //   : STATUS_EVENT_MAP[data.status] || /* istanbul ignore next */ uow.event.type,
//     timestamp: data.timestamp || uow.event.timestamp,
//     data,
//     //metric,
//     raw: undefined,
//   };
// };

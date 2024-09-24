import {
  cdc, upd as update, job,
} from '@alexnovitchkovburbank/custom-jgilbert-package';

import {
  toEvent as toThingEvent,
} from '../models/thing';

export default [
  {
    id: 't1',
    flavor: cdc,
    eventType: /metric-(created|updated|deleted)/,
    toEvent: toThingEvent,
    queryRelated: true,
  },
  {
    id: 'job1',
    flavor: job,
    eventType: 'job-created',
    toScanRequest: () => ({
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'APPROVED',
      },
      FilterExpression: '#status = :status',
    }),
    toEvent: () => ({ type: 'xyz' }),
  },
];

import { materialize } from '@alexnovitchkovburbank/custom-jgilbert-package';

import { toUpdateRequest as toThingUpdateRequest } from '../models/thing';

export default [
  {
    id: 'm1',
    flavor: materialize,
    eventType: /metric-(submitted|created|updated|deleted)/,
    toUpdateRequest: toThingUpdateRequest,
  },
];

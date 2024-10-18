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
  initialize,
  initializeFrom,
  defaultOptions,
  decryptEvent,
  fromKinesis,
  fromSqsEvent,
  getSecrets,
  prefilterOnEventTypes,
  toPromise,
} from '@alexnovitchkovburbank/custom-jgilbert-package';

import RULES from './rules';

const OPTIONS = {
  ...defaultOptions,
  // ...process.env,
};

const PIPELINES = {
  ...initializeFrom(RULES),
};

const { debug } = OPTIONS;

export class Handler {
  constructor(options = OPTIONS) {
    this.options = options;
  }

  handle(event, includeErrors = true) {
    return initialize(PIPELINES, this.options)
      .assemble(
        fromSqsEvent(event)
        // fromKinesis(event)
          .through(decryptEvent({
            ...this.options,
            prefilter: prefilterOnEventTypes(RULES),
          })),
        includeErrors,
      );
  }
}

export const handle = async (event, context, int = {}) => {
  debug('event: %j', event);
  debug('body: %j', JSON.parse(event.Records[0].body));
  debug('context: %j', context);

  // const options = await getSecrets(OPTIONS);

  return new Handler({ ...OPTIONS, ...int })
    .handle(event)
    .through(toPromise);
};

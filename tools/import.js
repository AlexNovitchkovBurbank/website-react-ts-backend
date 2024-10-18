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

const _ = require('highland');
const aws = require('aws-sdk')
aws.config.setPromisesDependency(require('bluebird'));

const client = new aws.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-west-2',
  httpOptions: { timeout: 1000 },
  logger: console,
});
const table = `template-bff-service-${process.env.STAGE || 'stg'}-entities`;

const main = () => {
  const data = require('./metrics.json');

  _(data)
    .map(save)
    .parallel(4)
    .each(console.log);
};

const save = ({ pk, discriminator, ...rec }) => {
  const params = {
    TableName: table,
    Item: {
      pk,
      sk: discriminator,
      discriminator,
      ...rec,
      timestamp: Date.now(),
      lastModifiedBy: 'system',
      awsregion: process.env.AWS_REGION || 'us-west-2',
    }
  };

  return _(client.put(params).promise());
};

main();

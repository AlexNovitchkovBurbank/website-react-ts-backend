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

const main = () => {
  console.log('[');

  listEntities()
    // .filter(data => data.sk === 'subject')
    .each(collected => console.log(JSON.stringify(collected), ','))
    .done(() => console.log(']'));

};

const listEntities = () => {
  const client = new aws.DynamoDB.DocumentClient({
    region: 'us-west-2',
    httpOptions: { timeout: 1000 },
    // logger: console,
  });

  let marker = undefined;

  return _((push, next) => {
    const params = {
      TableName: 'template-bff-service-stg-entities',
      ExclusiveStartKey: marker
    };

    client.scan(params).promise()
      .then(data => {
        if (data.LastEvaluatedKey) {
          marker = data.LastEvaluatedKey;;
        } else {
          marker = undefined;
        }

        data.Items.forEach(obj => {
          push(null, obj);
        })
      })
      .catch(err => {
        push(err, null);
      })
      .finally(() => {
        if (marker) {
          next();
        } else {
          push(null, _.nil);
        }
      })
  });
};

main();
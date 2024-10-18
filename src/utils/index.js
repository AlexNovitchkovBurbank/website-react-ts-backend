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

// import zlib from 'zlib';

export const debug = (api) => (req, res, next) => {
  api.app({
    debug: require("debug")(
      `handler${req.app._event.path.split("/").join(":")}`
    ),
  });

  req.namespace.debug("event: %j", req.app._event);
  // req.namespace.debug(`ctx: %j`, req.app._context);
  // req.namespace.debug(`env: %j`, process.env);

  return next();
};

export const cors = (req, res, next) => {
  res.cors({
    origin: "",
    methods: "GET, POST, OPTIONS",
    headers: "content-type, authorization",
    maxAge: 86400,
  });
  return next();
};

export const now = () => Date.now();
export const ttl = (start, days) =>
  Math.floor(start / 1000) + 60 * 60 * 24 * days;

// export const serializer = (body) => {
//   //   console.log('serializer: ', body);
//   if (!(body instanceof Buffer)) {
//     body = JSON.stringify(body);
//   }
//   return zlib.gzipSync(body).toString('base64');
// };

export const errorHandler = (err, req, res, next) => {
  // console.log('errorHandler: ', err.code, err);
  if (err.code) {
    res.status(err.code).json({ Message: err.message });
  }
  next();
};

export * from "./jwt";
export * from "./mapper";

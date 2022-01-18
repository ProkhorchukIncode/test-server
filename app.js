const express = require('express')
const app = express()

const { HttpCode } = require('./config/constants');

// app.use(cors());

app.use('/api/users', usersRouter);

app.use((_req, res) => {
  res
    .status(HttpCode.FORBIDDEN)
    .json({ status: 'error', code: HttpCode.FORBIDDEN, message: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.log(`error`, err);
  const statusCode = err.status || HttpCode.INTERNAL_SERVER_ERROR;
  res.status(statusCode).json({
    status: statusCode === HttpCode.INTERNAL_SERVER_ERROR ? 'fail' : 'error',
    code: statusCode,
    message: err.message,
  });
});

module.exports = app;
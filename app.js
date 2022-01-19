const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const usersRouter = require('./routes/users/users');
const { HttpCode } = require('./config/constants');

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter);

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
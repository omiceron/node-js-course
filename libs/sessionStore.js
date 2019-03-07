const MongooseStore = require('koa-session-mongoose');
const mongoose = require('./mongoose');

module.exports = new MongooseStore({
  connection: mongoose
});

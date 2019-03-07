const session = require('koa-session');
const store =  require('../libs/sessionStore');

exports.init = app => app.use(session({
  key: 'sid',
  signed: false,

  // touch session.updatedAt in DB & reset cookie on every visit to prolong the session
  // koa-session-mongoose resaves the session as a whole, not just a single field
  rolling: true,

  store
}, app));

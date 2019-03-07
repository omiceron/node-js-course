const Cookies = require('cookies');
const config = require('config');
const mongoose = require('./mongoose');
const User = require('../models/user');

const socketIO = require('socket.io');

const socketRedis = require('socket.io-redis');

const sessionStore = require('./sessionStore');

function socket(server) {
  const io = socketIO(server);

  io.adapter(socketRedis({ host: 'localhost', port: 6379 }));

  io.use(async function(socket, next) {
    // if android OR ios - check token
    const handshakeData = socket.request;
    const cookies = new Cookies(handshakeData, {}, config.keys);
    const sid = cookies.get('sid');
    const session = await sessionStore.get(sid);

    if (!session) {
      return next(new Error("No session"));
    }

    if (!session.passport && !session.passport.user) {
      return next(new Error("Anonymous session not allowed"));
    }

    // if needed: check if the user is allowed to join
    socket.user = await User.findById(session.passport.user);

    // if needed later: refresh socket.session on events
    socket.session = session;

    // on restarts may be junk sockedIds
    // no problem in them
    session.socketIds = session.socketIds
        ? session.socketIds.concat(socket.id)
        : [socket.id];

    await sessionStore.set(sid, session, null, {rolling: true});

    socket.on('disconnect', async function() {
      try {
        const session = await sessionStore.get(sid);
        if (session) {
          session.socketIds.splice(session.socketIds.indexOf(socket.id), 1);
          await sessionStore.set(sid, session, null, {rolling: true});
        }
      } catch (err) {
        console.log(err)
      }
    });

    next();
  });

  io.on('connection', function (socket) {
    socket.broadcast.emit('server-message', `${socket.user.displayName} connected.`);
    // io.emit()
    socket.emit('server-message', 'hello', (response) => {
      console.log("delivered", response);
    });

    let clients = {};

    socket.on('typing', (status) => {

      if (status) {
        clients[socket.user.displayName] = true;
        socket.broadcast.emit('server-typing', clients);
      } else {
        delete clients[socket.user.displayName];
        socket.broadcast.emit('server-typing', clients);
      }
    });

    socket.on('message', (message) => {
      if (!message) return;
      const deliveryTime = Date.now();
      io.emit('message', {user: socket.user, message, deliveryTime})
    });

    socket.on('disconnect', () => {
      console.log('disconnect');
    });
  });
}


const socketEmitter = require('socket.io-emitter');
const redisClient = require('redis').createClient(/*{localhost, 6379}*/);
socket.emitter = socketEmitter(redisClient);

module.exports = socket;

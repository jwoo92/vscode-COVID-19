const  EventEmitter = require('events');

class Poller extends EventEmitter {
  constructor(timeout) {
    super();

    if (!timeout) throw new Error('[Poller] timeout option required.');

    this.timeout = timeout;
    this.emitPoll = this.emitPoll.bind(this);
  }

  emitPoll() {
    this.emit('poll');
  }

  onPoll(cb) {
    this.on('poll', cb);
  }

  poll() {
    setTimeout(this.emitPoll, this.timeout);
  }
}

module.exports = Poller;

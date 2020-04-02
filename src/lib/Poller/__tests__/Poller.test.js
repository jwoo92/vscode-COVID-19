const Poller = require('../Poller');

let poller = null;

beforeEach(() => {
  poller = new Poller(1);
});

test('if error is thrown when interval is not passed in', () => {
  expect(() => new Poller()).toThrow();
});

test('if emits poll event', () => {
  const cb = jest.fn();
  poller.onPoll(cb);
  poller.emitPoll();

  expect(cb).toHaveBeenCalled();
});

test('if onPoll callback is called', async () => {
  const cb = jest.fn();
  poller.onPoll(cb);
  poller.poll();

  Promise.resolve(() => expect(cb).toHaveBeenCalled());
});

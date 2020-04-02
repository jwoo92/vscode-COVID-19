const main = require('..');

test('main', () => {
  expect(typeof main.activate).toBe('function');
  expect(typeof main.deactivate).toBe('function');
});

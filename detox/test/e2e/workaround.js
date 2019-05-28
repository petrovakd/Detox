const detoxAdapter = require('detox/runners/mocha/adapter');

const rnVersion = parseRNVersion();
const workaround = {
  it: {
    android: {
      rn57Max: (spec, specFn) => limitedAndroidSpec({maxMinor: 57}, spec, specFn),
      rn58Min: (spec, specFn) => limitedAndroidSpec({minMinor: 58}, spec, specFn),
    }
  },
};

function parseRNVersion() {
  const packageJson = require('../package.json');
  const raw = packageJson.dependencies['react-native'];
  const [major, minor, patch] = raw.split('.');
  return {
    major,
    minor,
    patch,
    raw,
  };
}

let lastContext;
beforeEach(function() {
  lastContext = {
    ...this
  };
});

function limitedAndroidSpec({minMinor, maxMinor}, spec, specFn) {
  it(spec, async function() {
    if (device.getPlatform() === 'android') {
      if ((minMinor && rnVersion.minor < minMinor) ||
          (maxMinor && rnVersion.minor > maxMinor)) {
        await skipCurrentTest(this);
        return;
      }
    }
    await specFn();
  });
}

async function skipCurrentTest(context) {
  // Note: this is our way of working around this issue: https://github.com/mochajs/mocha/issues/3740 (i.e. a
  // simple skip() isn't good enough).
  lastContext.currentTest.state = 'skipped';
  await detoxAdapter.afterEach(lastContext);

  context.skip();
}

module.exports = workaround;

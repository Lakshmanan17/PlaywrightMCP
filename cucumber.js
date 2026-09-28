module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: ['support/**/*.ts', 'step-definitions/**/*.ts'],
    format: ['progress'],
    publishQuiet: true
  }
};
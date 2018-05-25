const util = require("util");
const exec = util.promisify(require("child_process").exec);

const captureOutputFromCommand = async cmd => {
  const { stdout } = await exec(cmd);
  return stdout.trim();
};

module.exports = {
  captureOutputFromCommand
};

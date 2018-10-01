const { captureOutputFromCommand } = require("./command");

const searchLatestTag = async () => {
  try {
    return await captureOutputFromCommand("git describe --abbrev=0 --tags");
  } catch (e) {
    return null;
  }
};

const gitTagList = async () => {
  try {
    return await captureOutputFromCommand("git tag");
  } catch (e) {
    return null;
  }
};

const getCommitFromTag = async tag => {
  if (!tag) return null;
  try {
    return await captureOutputFromCommand(`git rev-list -n 1 "${tag}"`);
  } catch (e) {
    console.error(e);
    return null;
  }
};

module.exports = {
  searchLatestTag,
  getCommitFromTag,
  gitTagList
};

const { captureOutputFromCommand } = require("./command");

const searchLatestTag = async () => {
  try {
    return await captureOutputFromCommand("git describe --abbrev=0 --tags");
  } catch (e) {
    return null;
  }
};

const getCommitFromTag = async tag => {
  const searchTag = tag === "latest" ? await searchLatestTag() : tag;
  if (!searchTag) return null;
  try {
    return await captureOutputFromCommand(`git rev-list -n 1 "${searchTag}"`);
  } catch (e) {
    console.error(e);
    return null;
  }
};

module.exports = {
  searchLatestTag,
  getCommitFromTag
};

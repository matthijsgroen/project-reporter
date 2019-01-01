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

const getCommitFromDate = async date => {
  try {
    const result = await captureOutputFromCommand(
      `git log --oneline --until ${date} -n1`
    );
    const sha = result.split(" ")[0];
    return sha;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const getTagFromDate = async date => {
  try {
    const result = await captureOutputFromCommand(
      `git log --until ${date} -n1 --no-walk --tags --pretty="%h %d %s" --decorate=full`
    );
    const match = result.match(/tag: refs\/tags\/([^,)]+)/);
    return match[1];
  } catch (e) {
    console.error(e);
    return null;
  }
};

module.exports = {
  getCommitFromDate,
  getCommitFromTag,
  getTagFromDate,
  gitTagList,
  searchLatestTag
};

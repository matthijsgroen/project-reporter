const { searchLatestTag, getCommitFromTag } = require("./git");
const { captureOutputFromCommand } = require("./command");

const buildConfig = async (tag, options) => {
  const reportTag = tag === "latest" ? await searchLatestTag() : tag;

  const diffTag =
    options.tag === "latest" ? await searchLatestTag() : options.tag;

  const commit = await getCommitFromTag(reportTag);
  const diffCommit = await getCommitFromTag(diffTag);

  const reportDate = await captureOutputFromCommand(
    `git log ${commit} -n 1 --format=%ad --date=short`
  );

  return {
    title: options.title,
    onlyDeltas: !!options.onlyDeltas,
    reportTag,
    diffTag,
    commit,
    diffCommit,
    reportDate
  };
};

module.exports = {
  buildConfig
};

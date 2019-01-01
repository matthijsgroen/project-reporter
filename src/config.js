const {
  getCommitFromDate,
  getCommitFromTag,
  getTagFromDate,
  gitTagList,
  searchLatestTag
} = require("./git");
const { captureOutputFromCommand } = require("./command");

const tagToSemanticVersion = tag => {
  const elements = tag.match(/^([^\d]*)(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!elements) return false;
  const [full, prefix, major, minor, patch, postfix] = elements;

  return {
    full,
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prefix,
    postfix
  };
};

const semanticVersionSorter = (a, b) =>
  a.major > b.major
    ? 1
    : a.major < b.major
      ? -1
      : a.minor > b.minor
        ? 1
        : a.minor < b.minor
          ? -1
          : a.patch > b.patch
            ? 1
            : a.patch > b.patch
              ? -1
              : a.postfix < b.postfix
                ? -1
                : a.postfix > b.postfix
                  ? 1
                  : 0;

const searchOfMajor = async tag => {
  const latest = await searchLatestTag();
  const semanticLatest = tagToSemanticVersion(latest);

  const majorDelta = parseInt((tag.match(/-(\d+)$/) || [null, "0"])[1], 10);

  const previousMajor = semanticLatest.major - majorDelta;
  const allTags = (await gitTagList()) || [];
  const previousMajorVersions = allTags
    .split("\n")
    .map(tagToSemanticVersion)
    .filter(Boolean)
    .filter(tag => tag.major === previousMajor)
    .sort(semanticVersionSorter)
    .map(e => e.full);

  const result = previousMajorVersions[previousMajorVersions.length - 1];
  return result;
};

const processTag = async tag =>
  tag === "latest"
    ? await searchLatestTag()
    : /^latest-of-major(|-\d+)$/.test(tag)
      ? await searchOfMajor(tag)
      : tag;

const commitFromTagOrDate = tagOrDate =>
  /\d{4}-\d{2}-\d{2}/.test(tagOrDate)
    ? getCommitFromDate(tagOrDate)
    : getCommitFromTag(tagOrDate);

const tagFromTagOrDate = tagOrDate =>
  /\d{4}-\d{2}-\d{2}/.test(tagOrDate) ? getTagFromDate(tagOrDate) : tagOrDate;

const buildConfig = async options => {
  const diffTag = await processTag(options.from);
  const reportTag = await processTag(options.till);

  const commit = await commitFromTagOrDate(reportTag);
  const diffCommit = await commitFromTagOrDate(diffTag);

  const releaseTag = await tagFromTagOrDate(reportTag);
  const releaseDiffTag = await tagFromTagOrDate(diffTag);

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
    releaseTag,
    releaseDiffTag,
    reportDate
  };
};

module.exports = {
  buildConfig
};

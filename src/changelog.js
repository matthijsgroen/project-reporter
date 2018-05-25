const util = require("util");
const readFile = util.promisify(require("fs").readFile);

const shiftTillEntry = (lines, start) => {
  let line = lines[0];
  while ((line !== undefined) && !line.startsWith(start)) {
    lines.shift();
    line = lines[0];
  }
};

const outputTillEntry = (lines, start) => {
  let line = lines[0];
  while ((line !== undefined) && !line.startsWith(start)) {
    console.log(line);
    lines.shift();
    line = lines[0];
  }
};

const outputChangelog = async config => {
  const { diffTag, reportTag } = config;

  try {
    const log = await readFile("CHANGELOG.md", "utf8");
    const lines = log.split("\n");

    console.log(`## Changelog since ${diffTag || "start"}\n`);
    const start = reportTag === "HEAD" ? "##" : `## [${reportTag}]`;

    shiftTillEntry(lines, start);
    outputTillEntry(lines, `## [${diffTag}]`);
  } catch (e) {
    console.log("## No Changelog found\n")
    console.log("Please add a CHANGELOG.md according to <https://keepachangelog.com/>")
  }

  console.log("");
};

module.exports = {
  outputChangelog
}

#!/usr/bin/env node

const program = require("commander");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const crypto = require("crypto");
const readFile = util.promisify(require("fs").readFile);

program.version("0.0.1");

program.on("*", action => {
  console.log("Unknown command '" + action + "'");
  return program.help();
});

const parseTag = tag => tag;

const searchLatestTag = async () =>
  await captureOutputFrom("git describe --abbrev=0 --tags");

const getCommitFromTag = async tag => {
  const searchTag = tag === "latest" ? await searchLatestTag() : tag;
  try {
    return await captureOutputFrom(`git rev-list -n 1 "${searchTag}"`);
  } catch (e) {
    console.error(e);
    return null;
  }
};

const captureOutputFrom = async cmd => {
  const { stdout } = await exec(cmd);
  return stdout.trim();
};

const diff = (dataA, dataB, field) => {
  const a = dataA[field] || 0;
  const b = dataB[field] || 0;
  if (a === b) return "0";
  if (a > b) return `+${(a - b).toLocaleString("en-US")}`;
  return `${(a - b).toLocaleString("en-US")}`;
};

const getColumnWidths = (rows, columns) => {
  const baseWidths = {};
  columns.forEach(column => (baseWidths[column.field] = column.caption.length));

  return rows.reduce((result, row) => {
    const update = {};
    Object.keys(row).forEach(key => {
      update[key] = Math.max(result[key] || 0, row[key].length);
    });
    return update;
  }, baseWidths);
};

const padContent = (text, width, align, padChar = " ") => {
  const space = Array(width)
    .fill(padChar)
    .join("");
  if (align === "left") {
    return `${text}${space}`.slice(0, width);
  }
  return `${space}${text}`.slice(-width);
};

const writeHeaders = (columns, widths) => {
  const strings = columns.map(column =>
    padContent(column.caption, widths[column.field], column.align)
  );
  console.log(`| ${strings.join(" | ")} |`);

  const dividers = columns.map(column =>
    padContent(":", widths[column.field], column.align, "-")
  );
  console.log(`| ${dividers.join(" | ")} |`);
};

const writeRow = (row, columns, widths) => {
  const strings = columns.map(column =>
    padContent(row[column.field], widths[column.field], column.align)
  );
  console.log(`| ${strings.join(" | ")} |`);
};

const buildConfig = async (tag, options) => {
  const reportTag = tag === "latest" ? await searchLatestTag() : tag;

  const diffTag =
    options.tag === "latest" ? await searchLatestTag() : options.tag;

  const commit = await getCommitFromTag(reportTag);
  const diffCommit = await getCommitFromTag(diffTag);

  const reportDate = await captureOutputFrom(
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

const outputTitle = config => {
  console.log(
    "# %s for %s - %s\n",
    config.title,
    config.reportTag,
    config.reportDate
  );
};

const outputTable = (columns, rows) => {
  const columnWidths = getColumnWidths(rows, columns);
  writeHeaders(columns, columnWidths);
  rows.forEach(row => writeRow(row, columns, columnWidths));
};

const outputCodebaseChanges = async config => {
  const { diffCommit, commit, diffTag, onlyDeltas } = config;

  const previous = await captureOutputFrom(
    `cloc "${diffCommit}" --json --quiet`
  );
  const diffStructure = JSON.parse(previous);
  delete diffStructure["header"];

  const report = await captureOutputFrom(`cloc "${commit}" --json --quiet`);
  const reportStructure = JSON.parse(report);
  delete reportStructure["header"];

  const technologies = Object.keys(diffStructure);
  const newTechnologies = Object.keys(diffStructure).filter(
    tech => !technologies.includes(tech)
  );

  const columns = [
    { caption: "Technology", align: "left", field: "tech" },
    { caption: "Files", align: "right", field: "files" },
    { caption: "delta", align: "left", field: "filesDelta" },
    { caption: "Code", align: "right", field: "code" },
    { caption: "delta", align: "left", field: "codeDelta" },
    { caption: "Comments", align: "right", field: "comments" },
    { caption: "delta", align: "left", field: "commentsDelta" }
  ];

  const rows = [...newTechnologies, ...technologies]
    .map(technology => {
      const data = reportStructure[technology] || {};
      const previousData = diffStructure[technology] || {};

      return {
        tech: technology,
        files: `${(data.nFiles || 0).toLocaleString("en-US")}`,
        filesDelta: `${diff(data, previousData, "nFiles")}`,
        comments: `${(data.comment || 0).toLocaleString("en-US")}`,
        commentsDelta: `${diff(data, previousData, "comment")}`,
        code: `${(data.code || 0).toLocaleString("en-US")}`,
        codeDelta: `${diff(data, previousData, "code")}`
      };
    })
    .filter(row => {
      const noDelta =
        row.filesDelta === "0" &&
        row.commentsDelta === "0" &&
        row.codeDelta === "0";
      return (onlyDeltas && !noDelta) || !onlyDeltas;
    });

  console.log(`## Codebase technology changes since ${diffTag}\n`);

  outputTable(columns, rows);

  console.log("");
};

const shiftTillEntry = (lines, start) => {
  let line = lines[0];
  while (!line.startsWith(start)) {
    lines.shift();
    line = lines[0];
  }
};

const outputTillEntry = (lines, start) => {
  let line = lines[0];
  while (!line.startsWith(start)) {
    console.log(line);
    lines.shift();
    line = lines[0];
  }
};

const outputChangelog = async config => {
  const { diffTag, reportTag } = config;
  console.log(`## Changelog since ${diffTag}\n`);

  const log = await readFile("CHANGELOG.md", "utf8");
  const lines = log.split("\n");

  const start = reportTag === "HEAD" ? "##" : `## [${reportTag}]`;

  shiftTillEntry(lines, start);
  outputTillEntry(lines, `## [${diffTag}]`);

  console.log("");
};

const gravatarUrlFromEmail = email =>
  `https://www.gravatar.com/avatar/${crypto
    .createHash("md5")
    .update(email.toLowerCase())
    .digest("hex")}?d=identicon&s=60`;

const emailToPicture = (email, name, ref) =>
  `[${ref}]: ${gravatarUrlFromEmail(email)} "${name}"`;

const imageRef = (name, ref) => `![${name}][${ref}]`;

const outputContributions = async config => {
  const { diffTag, reportTag } = config;
  const data = await captureOutputFrom(
    `git shortlog -s -n -e --no-merges ${diffTag}..${reportTag}`
  );

  console.log(
    `## Contributors that brought us from ${diffTag} to ${reportTag}\n`
  );

  const columns = [
    { caption: " ", align: "left", field: "pictureRef" },
    { caption: "Name", align: "left", field: "name" },
    { caption: "Commits", align: "right", field: "commits" }
  ];

  const rows = data
    .split("\n")
    .map((line, index) => {
      const rowData = line.match(/^\s*(\d+)\s+([^<]+)<([^>+]+)>\s*$/);
      if (!rowData) return null;
      const imageRefKey = `image-${index}`;
      const name = rowData[2].trim();
      return {
        name,
        commits: rowData[1],
        pictureRef: imageRef(name, imageRefKey),
        picture: emailToPicture(rowData[3], name, imageRefKey)
      };
    })
    .filter(Boolean);

  outputTable(columns, rows);
  console.log("");

  rows.forEach(row => console.log(row.picture));

  console.log("");
};

program
  .command("stats [tag]")
  .description("Create a codebase diff")
  .option("-t --tag [tag]", "Git tag to diff to [latest]", parseTag, "latest")
  .option(
    "--title [title]",
    "Title for the report [Report]",
    parseTag,
    "Report"
  )
  .option("--no-codebase", "Skip codebase change report")
  .option("--no-changelog", "Skip changelog report")
  .option("--no-contributors", "Skip contributor report")
  .option(
    "--only-deltas",
    "Skip codebase indicators that have a delta of 0",
    parseTag,
    false
  )
  .action(async (tag = "HEAD", options) => {
    const config = await buildConfig(tag, options);

    outputTitle(config);
    if (options.changelog) await outputChangelog(config);
    if (options.codebase) await outputCodebaseChanges(config);
    if (options.contributors) await outputContributions(config);
  });

program.parse(process.argv);

const { captureOutputFromCommand } = require("./command");
const { outputTable } = require("./markdown");

const diff = (dataA, dataB, field) => {
  const a = dataA[field] || 0;
  const b = dataB[field] || 0;
  if (a === b) return "0";
  if (a > b) return `+${(a - b).toLocaleString("en-US")}`;
  return `${(a - b).toLocaleString("en-US")}`;
};

const outputCodebaseChanges = async config => {
  const { diffCommit, commit, diffTag, onlyDeltas } = config;

  if (!diffCommit) return;
  const previous = await captureOutputFromCommand(
    `cloc "${diffCommit}" --json --quiet`
  );
  const diffStructure = JSON.parse(previous);
  delete diffStructure["header"];

  const report = await captureOutputFromCommand(`cloc "${commit}" --json --quiet`);
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

  console.log(`## Codebase technology changes since ${diffTag || "start"}\n`);

  outputTable(columns, rows);

  console.log("");
};

module.exports = {
  outputCodebaseChanges
}

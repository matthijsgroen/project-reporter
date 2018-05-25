const crypto = require("crypto");
const { captureOutputFromCommand } = require("./command");
const { outputTable } = require("./markdown");

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
  if (!(diffTag && reportTag)) return;

  const data = await captureOutputFromCommand(
    `git shortlog -s -n -e --no-merges ${diffTag}..${reportTag}`
  );

  const displayName = reportTag === "HEAD"
   ? "here"
  : reportTag
  console.log(
    `## Contributors that brought us from ${diffTag} to ${displayName}\n`
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

module.exports = {
  outputContributions
};

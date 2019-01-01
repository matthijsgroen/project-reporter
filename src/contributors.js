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
  const { commit, diffCommit, reportTag, diffTag } = config;
  if (!(commit && diffCommit)) return;

  const data = await captureOutputFromCommand(
    `git shortlog -s -n -e --no-merges ${diffCommit}..${commit}`
  );

  const displayName = reportTag === "HEAD" ? "here" : reportTag;
  console.log(
    `## Contributors that brought us from ${diffTag} to ${displayName}\n`
  );

  const columns = [
    { caption: " ", align: "left", field: "pictureRef" },
    { caption: "Name", align: "left", field: "name" },
    { caption: "Commits", align: "right", field: "commits" }
  ];

  const people = {};
  data.split("\n").map((line, index) => {
    const rowData = line.match(/^\s*(\d+)\s+([^<]+)<([^>+]+)>\s*$/);
    if (!rowData) return null;
    const imageRefKey = `image-${index}`;
    const name = rowData[2].trim();
    const exist = people[name];
    const newPerson = {
      name,
      commits: parseInt(rowData[1], 10),
      pictureRef: imageRef(name, imageRefKey),
      picture: emailToPicture(rowData[3], name, imageRefKey)
    };

    const merged =
      exist && newPerson
        ? exist.commits > newPerson.commits
          ? { ...exist, commits: exist.commits + newPerson.commits }
          : { ...newPerson, commits: exist.commits + newPerson.commits }
        : newPerson;
    people[name] = merged;
  });

  const rows = Object.values(people)
    .filter(Boolean)
    .sort(
      (a, b) => (a.commits < b.commits ? 1 : a.commits > b.commits ? -1 : 0)
    )
    .map(person => ({
      ...person,
      commits: `${person.commits}`
    }));

  outputTable(columns, rows);
  console.log("");

  rows.forEach(row => console.log(row.picture));

  console.log("");
};

module.exports = {
  outputContributions
};

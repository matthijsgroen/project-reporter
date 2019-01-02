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

const formatNumber = number => number.toLocaleString("en-US");

const getAuthorStats = async (name, diffCommit, commit) => {
  const report = { add: 0, del: 0 };
  try {
    const result = await captureOutputFromCommand(
      `git log --shortstat --author "${name}" ${diffCommit}..${commit} | grep "files\\? changed"`
    );
    const stats = result.split("\n").forEach(line => {
      line
        .split(",")
        .map(item => item.trim().split(" "))
        .forEach(([nr, update]) => {
          const insert = update.startsWith("ins");
          const deletion = update.startsWith("del");
          const amount = parseInt(nr, 10);
          insert
            ? (report.add += amount)
            : deletion
              ? (report.del += amount)
              : null;
        });
    });
  } catch (e) {}
  return report;
};

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
    { caption: "Commits", align: "right", field: "commits" },
    { caption: "Additions", align: "right", field: "additions" },
    { caption: "Deletions", align: "right", field: "deletions" }
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
      commits: formatNumber(person.commits)
    }));

  for (const person of rows) {
    const statData = await getAuthorStats(person.name, diffCommit, commit);
    person.additions = formatNumber(statData.add);
    person.deletions = formatNumber(statData.del);
  }
  outputTable(columns, rows);
  console.log("");

  rows.forEach(row => console.log(row.picture));

  console.log("");
};

module.exports = {
  outputContributions
};

const program = require("commander");
const { buildConfig } = require("./config");
const { outputChangelog } = require("./changelog");
const { outputCodebaseChanges } = require("./technology");
const { outputContributions } = require("./contributors");

program.version("1.0.1-alpha.2");

const parseTag = tag => tag;

const outputTitle = config => {
  console.log(
    "# %s for %s - %s\n",
    config.title,
    config.reportTag === "HEAD"
    ? "upcoming release"
    : config.reportTag,
    config.reportDate
  );
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

function run(args) {
  program.parse(args);
  if (program.args.length === 0) {
    program.outputHelp();
  }
}

module.exports = {
  run
};

const program = require("commander");
const { buildConfig } = require("./config");
const { outputChangelog } = require("./changelog");
const { outputCodebaseChanges } = require("./technology");
const { outputContributions } = require("./contributors");

program.version("1.0.1");

const parseTag = tag => tag;

const outputTitle = config => {
  console.log(
    "# %s for %s - %s\n",
    config.title,
    config.reportTag === "HEAD" ? "upcoming release" : config.reportTag,
    config.reportDate
  );
};

program
  .command("stats", { isDefault: true })
  .description(
    "Create a codebase diff. By default, it will show the upcoming changes since the last tag."
  )
  .option("--from [tag]", "Git tag to diff from [HEAD]", parseTag, "HEAD")
  .option("--till [tag]", "Git tag to diff to [latest]", parseTag, "latest")
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
  .action(async options => {
    const config = await buildConfig(options);

    if (!config.commit || !config.diffCommit) {
      console.error("Couldn't determine both git commits for report");
      process.exit(1);
    }

    outputTitle(config);
    if (options.changelog) await outputChangelog(config);
    if (options.codebase) await outputCodebaseChanges(config);
    if (options.contributors) await outputContributions(config);
  })
  .on("--help", () => {
    console.log("");
    console.log("Examples:");
    console.log("");
    console.log("  Display upcoming changes:");
    console.log("  $ project-reporter stats");
    console.log("");
    console.log("  Current release till previous major:");
    console.log(
      "  $ project-reporter stats --from latest --till latest-of-major-1"
    );
    console.log("  All changes of current major:");
    console.log(
      "  $ project-reporter stats --from latest-of-major --till lastest-of-major-1"
    );
    console.log("  All changes of previous major:");
    console.log(
      "  $ project-reporter stats --from latest-of-major-1 --till latest-of-major-2"
    );
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

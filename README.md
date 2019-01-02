# Project Reporter

Auto generate release and codebase reports

## Usage

```
  Usage: stats [options]

  Create a codebase diff. By default, it will show the upcoming changes since the last tag.

  Options:

    --from, --since [tag]  Git tag to diff from [latest] (default: latest)
    --till, --until [tag]  Git tag to diff to [HEAD] (default: HEAD)
    --title [title]        Title for the report [Report] (default: Report)
    --no-codebase          Skip codebase change report
    --no-changelog         Skip changelog report
    --no-contributors      Skip contributor report
    --only-deltas          Skip codebase indicators that have a delta of 0
    -h, --help             output usage information

Examples:

  Display upcoming changes:
  $ project-reporter stats

  Current release till previous major:
  $ project-reporter stats --from latest --till latest-of-major-1
  All changes of current major:
  $ project-reporter stats --from latest-of-major --till lastest-of-major-1
  All changes of previous major:
  $ project-reporter stats --from latest-of-major-1 --till latest-of-major-2
  All changes of a time period:
  $ project-reporter stats --from 2018-01-01 --till 2019-01-01

```


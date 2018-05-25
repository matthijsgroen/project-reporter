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

const outputTable = (columns, rows) => {
  const columnWidths = getColumnWidths(rows, columns);
  writeHeaders(columns, columnWidths);
  rows.forEach(row => writeRow(row, columns, columnWidths));
};

module.exports = {
  outputTable
}

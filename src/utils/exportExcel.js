function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadExcel(filename, rows) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const headerCells = headers
    .map((header) => `<Cell><Data ss:Type="String">${xmlEscape(header)}</Data></Cell>`)
    .join("");
  const body = rows
    .map((row) => {
      const cells = headers
        .map((header) => {
          const value = row[header];
          const numeric = typeof value === "number" && Number.isFinite(value);
          return `<Cell><Data ss:Type="${numeric ? "Number" : "String"}">${xmlEscape(value)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Data">
<Table>
<Row>${headerCells}</Row>
${body}
</Table>
</Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

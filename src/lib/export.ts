export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number): string => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];

  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCsv(headers: string[], rows: (string | number)[][], filename: string) {
  downloadFile(toCsv(headers, rows), filename, "text/csv;charset=utf-8;");
}

export function exportJson(data: unknown, filename: string) {
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json");
}

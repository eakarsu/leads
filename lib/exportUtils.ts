export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, data: Record<string, any>[]) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const headerRow = headers.map((h) => `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left">${h}</th>`).join('');
  const rows = data
    .map(
      (row) =>
        '<tr>' +
        headers
          .map((h) => {
            const val = row[h];
            return `<td style="border:1px solid #ddd;padding:8px">${val ?? ''}</td>`;
          })
          .join('') +
        '</tr>'
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}@media print{button{display:none}}</style>
    </head><body>
    <h1>${title}</h1>
    <p>Exported on ${new Date().toLocaleDateString()} | ${data.length} records</p>
    <table>${headerRow}${rows}</table>
    <br><button onclick="window.print()">Print / Save as PDF</button>
    </body></html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

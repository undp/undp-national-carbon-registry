import moment from 'moment';

export function downloadCSV(data: any, filename = 'data.csv', filterCols: string[] = []) {
  console.log('----------data-------------', data);
  // Extract headers from object keys
  const headers = Object.keys(data[0]).filter((key: string) => !filterCols.includes(key));

  // Map objects to CSV rows
  const csvContent = [
    headers.join(','), // Header row
    ...Object.values(data).map((row: any) =>
      headers
        .map((field) => {
          if (field === 'startDate') {
            return moment.unix(Number(row[field])).format('DD/MM/YYYY');
          }
          return String(row[field] ?? '');
        })
        .join(',')
    ), // Data rows
  ].join('\n');

  // Create a Blob and a temporary anchor element
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');

  // Create download link
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  // Trigger the download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
}

// Example usage:
// const data = [
//     ["Name", "Age", "City"],
//     ["Alice", 25, "New York"],
//     ["Bob", 30, "Los Angeles"],
//     ["Charlie", 28, "Chicago"]
// ];

// // Call function to download CSV
// downloadCSV(data, "my_data.csv");

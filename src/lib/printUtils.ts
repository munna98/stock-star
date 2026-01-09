export interface PrintOptions {
  title: string;
  subtitle?: string;
  filters?: Record<string, string>;
  data: any[];
  columns: PrintColumn[];
  showFilters?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface PrintColumn {
  header: string;
  accessor: string;
  format?: (value: any) => string;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export const generatePrintHTML = (options: PrintOptions): string => {
  const { title, subtitle, filters, data, columns, showFilters, orientation = 'portrait' } = options;

  const filterHTML = showFilters && filters ? `
    <div class="print-filters">
      <h3>Applied Filters:</h3>
      <ul>
        ${Object.entries(filters)
      .filter(([_, v]) => v && v !== 'all' && v !== '')
      .map(([k, v]) => `<li><strong>${formatFilterKey(k)}:</strong> ${v}</li>`)
      .join('')}
      </ul>
    </div>
  ` : '';

  const tableHTML = `
    <table class="print-table">
      <thead>
        <tr>
          ${columns.map(col => `<th style="text-align: ${col.align || 'left'}; width: ${col.width || 'auto'}">${col.header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${columns.map(col => `
              <td style="text-align: ${col.align || 'left'}">
                ${col.format ? col.format(row[col.accessor]) : row[col.accessor]}
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page { 
          size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
          margin: 0;
        }
        @media print {
          body { padding: 15mm; }
          .no-print { display: none; }
          .print-header { page-break-after: avoid; }
          /* Allow table to break across pages */
          .print-table { page-break-inside: auto; }
          .print-table tr { break-inside: avoid; page-break-inside: avoid; }
          .print-table thead { display: table-header-group; }
          .print-table tfoot { display: table-footer-group; }
        }

        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .print-header h1 { font-size: 24px; margin-bottom: 5px; }
        .print-header p { color: #666; font-size: 14px; }
        .print-timestamp { 
          color: #999; 
          font-size: 12px; 
          margin-top: 5px;
        }

        .print-filters {
          background: #f5f5f5;
          padding: 10px;
          margin-bottom: 15px;
          border-left: 4px solid #2563eb;
          page-break-inside: avoid;
        }
        .print-filters h3 { margin-bottom: 5px; font-size: 14px; }
        .print-filters ul { margin-left: 20px; }
        .print-filters li { margin: 2px 0; font-size: 12px; }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .print-table th {
          background: #2563eb;
          color: white;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #1e40af;
          font-size: 12px;
        }
        .print-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }
        .print-table tr:nth-child(even) {
          background: #f9fafb;
        }
        .print-table tr:hover {
          background: #f3f4f6;
        }

        .print-footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          color: #999;
          font-size: 10px;
          text-align: center;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
        <div class="print-timestamp">
          Printed on ${new Date().toLocaleString()}
        </div>
      </div>

      ${filterHTML}
      ${tableHTML}

      <div class="print-footer">
        <p>This is a system-generated report. For official use only.</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

export interface VoucherPrintOptions {
  title: string;
  details: {
    label: string;
    value: string;
  }[];
  items: {
    item_code: string;
    item_name: string;
    brand_name?: string;
    model_name?: string;
    quantity: number;
    unit?: string;
  }[];
}

export const generateVoucherPrintHTML = (options: VoucherPrintOptions): string => {
  const { title, details, items } = options;

  const detailRows = [];
  for (let i = 0; i < details.length; i += 2) {
    const col1 = details[i];
    const col2 = details[i + 1];
    detailRows.push(`
      <tr>
        <td class="detail-label">${col1.label}:</td>
        <td class="detail-value">${col1.value}</td>
        ${col2 ? `
          <td class="detail-label">${col2.label}:</td>
          <td class="detail-value">${col2.value}</td>
        ` : '<td></td><td></td>'}
      </tr>
    `);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page { size: A4 portrait; margin: 0; }
        @media print {
          body { padding: 15mm; }
          .no-print { display: none; }
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header h1 { font-size: 20px; font-weight: bold; text-transform: uppercase; }
        
        .details-table {
          width: 100%;
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        .details-table td {
          padding: 5px;
          border: none;
        }
        .detail-label {
          font-weight: bold;
          width: 15%;
          color: #555;
          font-size: 13px;
        }
        .detail-value {
          width: 35%;
          font-size: 13px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .items-table th {
          background: #f3f4f6;
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
        }
        .items-table td {
          border: 1px solid #ddd;
          padding: 6px 8px;
          font-size: 12px;
        }
        .items-table .text-right { text-align: right; }
        .items-table .text-center { text-align: center; }

        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .signature-line {
          border-top: 1px solid #333;
          width: 200px;
          text-align: center;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
      </div>

      <table class="details-table">
        <tbody>
          ${detailRows.join('')}
        </tbody>
      </table>

      <table class="items-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 50px">S.No</th>
            <th>Item Details</th>
            <th class="text-right" style="width: 100px">Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>
                <div style="font-weight: 500">${item.item_name}</div>
                <div style="font-size: 11px; color: #666">
                  ${[item.item_code, item.brand_name, item.model_name].filter(Boolean).join(' | ')}
                </div>
              </td>
              <td class="text-right">${item.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div class="signature-block">
          <div style="height: 40px"></div>
          <div class="signature-line">Authorized Signatory</div>
        </div>
        <div class="signature-block">
          <div style="height: 40px"></div>
          <div class="signature-line">Receiver's Signature</div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

export const openPrintWindow = (html: string) => {
  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content (specifically images/fonts) to load
    iframe.onload = () => {
      // Small delay to ensure styles are applied
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print failed:', e);
        } finally {
          // Remove iframe after printing (with a delay to ensure print dialog doesn't break)
          // Note: In some browsers, removing immediately might cancel print. 
          // 1 minute timeout is safe, or we can listen to afterprint event if supported.
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 60000);
        }
      }, 500);
    };
  } else {
    console.error('Failed to access iframe document');
  }
};

function formatFilterKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
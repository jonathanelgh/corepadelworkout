export type PaymentReceipt = {
  receiptId: string;
  affiliateName: string;
  email: string;
  period: string;
  amount: string;
  paidOn: string;
  lines: Array<{ date: string; sale: string; commission: string }>;
};

function winAnsi(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 63;
    if (code === 10 || code === 13) continue;
    if (code >= 32 && code <= 126) {
      out += char;
      continue;
    }
    if (code === 8364) {
      out += "EUR";
      continue;
    }
    out += "?";
  }
  return out.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pageStream(rows: string[]): string {
  const commands = ["BT", "/F1 18 Tf", "50 790 Td", `(${winAnsi(rows[0] ?? "")}) Tj`, "/F1 11 Tf"];
  rows.slice(1).forEach((row, index) => {
    const size = index === 0 ? 14 : 11;
    commands.push(`/F1 ${size} Tf`);
    commands.push("0 -22 Td");
    commands.push(`(${winAnsi(row)}) Tj`);
  });
  commands.push("ET");
  return commands.join("\n");
}

/** Single-page receipt. Text is WinAnsi, so euro signs are written as EUR. */
export function buildPaymentReceipt(receipt: PaymentReceipt): Uint8Array {
  const rows = [
    "CorePadel",
    "Payment receipt",
    "",
    `Receipt ${receipt.receiptId}`,
    `Affiliate  ${receipt.affiliateName}`,
    `Email  ${receipt.email}`,
    `Period  ${receipt.period}`,
    `Amount  ${receipt.amount}`,
    `Paid  ${receipt.paidOn}`,
    "",
    "This confirms CorePadel paid the commission below.",
    "",
    "Date            Sale            Commission",
    ...receipt.lines.slice(0, 24).map((line) => `${line.date}    ${line.sale}    ${line.commission}`),
  ];
  if (receipt.lines.length > 24) {
    rows.push(`And ${receipt.lines.length - 24} more invoices.`);
  }

  const stream = pageStream(rows);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(body);
}

export function receiptAmount(cents: number, currency: string): string {
  return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
}

import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export const generateReceipt = (transaction: any) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // Mini receipt format
  });

  const margin = 10;
  let y = 15;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FORSDIGPAY', 40, y, { align: 'center' });
  
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Payment Solutions', 40, y, { align: 'center' });

  y += 10;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, 70, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STRUK TRANSAKSI', 40, y, { align: 'center' });

  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const addField = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    const splitValue = doc.splitTextToSize(value, 40);
    doc.text(splitValue, 70, y, { align: 'right' });
    y += 6;
  };

  addField('ID Transaksi:', transaction.id.toUpperCase());
  addField('Waktu:', format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm'));
  addField('Tipe:', transaction.productId ? 'Pembelian' : 'Topup Saldo');
  
  if (transaction.productName) {
    addField('Produk:', transaction.productName);
  }
  
  if (transaction.target) {
    addField('Tujuan:', transaction.target);
  }

  y += 4;
  doc.line(margin, y, 70, y);
  
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', margin, y);
  doc.text(`Rp ${transaction.amount.toLocaleString('id-ID')}`, 70, y, { align: 'right' });

  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Status: BERHASIL', 40, y, { align: 'center' });

  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.text('Terima kasih telah menggunakan Forsdigpay', 40, y, { align: 'center' });
  
  y += 4;
  doc.text('Simpan struk ini sebagai bukti pembayaran sah', 40, y, { align: 'center' });

  doc.save(`Receipt-${transaction.id}.pdf`);
};

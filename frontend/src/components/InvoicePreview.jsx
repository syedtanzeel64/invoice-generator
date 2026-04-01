import React, { forwardRef } from 'react';

const InvoicePreview = forwardRef(({ invoiceData }, ref) => {
  const {
    invoiceNumber, dateOfIssue, billToName, billToAddress, billToPhone, billToEmail,
    companyName, companyAddress, companyCity, companyPhone, companyEmail, logoUrl,
    items, discountRate, amountPaid
  } = invoiceData;

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.hours) * parseFloat(item.rate) || 0), 0);
  const discountAmount = subtotal * (parseFloat(discountRate) / 100 || 0);
  const totalAmount = subtotal - discountAmount;
  const balanceDue = totalAmount - parseFloat(amountPaid || 0);

  const formatINR = (num) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(num || 0));

  // Base styles to prevent html2canvas squashing
  const baseText = {
    letterSpacing: '0px',
    wordSpacing: 'normal',
    fontVariantLigatures: 'none',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const styles = {
    container: {
      ...baseText,
      width: '800px',
      minHeight: '1056px',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif',
      color: '#1a1a1a',
      position: 'relative',
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      transform: 'none',
    },
    headerBanner: {
      backgroundColor: '#1f7396',
      height: '160px',
      width: '100%',
      padding: '40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      boxSizing: 'border-box',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    logo: {
      maxHeight: '80px',
      maxWidth: '160px',
      objectFit: 'contain',
      backgroundColor: 'rgba(255,255,255,0.15)',
      padding: '10px',
      borderRadius: '8px',
      display: logoUrl ? 'block' : 'none',
    },
    invoiceLabel: {
      color: '#ffffff',
      fontSize: '48px',
      fontWeight: 'bold',
      margin: '0',
      textTransform: 'uppercase',
    },
    companyInfo: {
      color: '#ffffff',
      textAlign: 'right',
    },
    companyName: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '5px',
      textTransform: 'uppercase',
    },
    companyDetail: {
      fontSize: '11px',
      opacity: '0.9',
      marginBottom: '2px',
    },
    content: {
      padding: '50px 40px',
      flexGrow: 1,
    },
    metaGrid: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '40px',
    },
    metaBlock: {
      fontSize: '13px',
      width: '350px',
    },
    metaItem: {
      display: 'table',
      width: '100%',
      marginBottom: '10px',
    },
    metaLabel: {
      display: 'table-cell',
      fontWeight: 'bold',
      width: '140px',
      color: '#4b5563',
      verticalAlign: 'top',
    },
    metaValue: {
      display: 'table-cell',
      color: '#111827',
      verticalAlign: 'top',
    },
    billTo: {
      textAlign: 'right',
      width: '300px',
    },
    billToHeader: {
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#1f7396',
      marginBottom: '8px',
      textTransform: 'uppercase',
    },
    billToInfo: {
      fontSize: '13px',
      color: '#4b5563',
      lineHeight: '1.6',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
      tableLayout: 'fixed',
    },
    thead: {
      borderBottom: '2px solid #1f7396',
    },
    th: {
      padding: '12px 10px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      color: '#1f7396',
      textAlign: 'left',
      backgroundColor: '#f9fafb',
    },
    tbody: {},
    tr: {
      borderBottom: '1px solid #e5e7eb',
    },
    td: {
      padding: '15px 10px',
      fontSize: '13px',
      color: '#111827',
      wordBreak: 'break-word',
    },
    summarySection: {
      marginTop: '40px',
      display: 'flex',
      justifyContent: 'space-between',
    },
    signatureContainer: {
      width: '40%',
      marginTop: '80px',
    },
    signatureLine: {
      borderTop: '2px solid #1a1a1a',
      paddingTop: '10px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      textAlign: 'center',
      width: '220px',
    },
    totalsContainer: {
      width: '280px',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: '14px',
    },
    balanceBlock: {
      backgroundColor: balanceDue > 0 ? '#fef2f2' : '#f0fdf4', // Reddish if balance exists, else greenish
      padding: '15px 10px',
      marginTop: '10px',
      borderRadius: '4px',
      borderLeft: `4px solid ${balanceDue > 0 ? '#ef4444' : '#22c55e'}`,
    },
    balanceRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontWeight: 'bold',
      fontSize: '18px',
      color: balanceDue > 0 ? '#b91c1c' : '#15803d',
    },
    footerBanner: {
      backgroundColor: '#1f7396',
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: 'bold',
      padding: '10px 20px',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container} ref={ref} id="invoice-capture-area">
      {/* Premium Header */}
      <div style={styles.headerBanner}>
        <div style={styles.logoContainer}>
          {logoUrl && <img src={logoUrl} alt="Company Logo" style={styles.logo} />}
          <h1 style={styles.invoiceLabel}>Invoice</h1>
        </div>
        <div style={styles.companyInfo}>
          <div style={styles.companyName}>{companyName || 'YOUR BUSINESS NAME'}</div>
          <div style={styles.companyDetail}>{companyAddress || 'STREET ADDRESS'}</div>
          <div style={styles.companyDetail}>{companyCity || 'CITY, STATE, ZIP'}</div>
          <div style={styles.companyDetail}>{companyPhone || 'PHONE'}</div>
          <div style={styles.companyDetail}>{companyEmail || 'EMAIL ADDRESS'}</div>
        </div>
      </div>

      <div style={styles.content}>
        {/* Meta & Bill To Grid */}
        <div style={styles.metaGrid}>
          <div style={styles.metaBlock}>
            <div style={styles.metaItem}>
              <div style={styles.metaLabel}>INVOICE NO.</div>
              <div style={styles.metaValue}>{invoiceNumber || 'INV-0000'}</div>
            </div>
            <div style={styles.metaItem}>
              <div style={styles.metaLabel}>DATE ISSUED</div>
              <div style={styles.metaValue}>{dateOfIssue || 'ENTER DATE'}</div>
            </div>
          </div>

          <div style={styles.billTo}>
            <div style={styles.billToHeader}>BILL TO</div>
            <div style={styles.billToInfo}>
              <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '15px', marginBottom: '5px' }}>{billToName || 'CLIENT NAME'}</div>
              <div>{billToAddress || 'CLIENT ADDRESS'}</div>
              <div>{billToPhone || 'PHONE'}</div>
              <div>{billToEmail || 'EMAIL'}</div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: '40px' }}>NO.</th>
              <th style={styles.th}>DESCRIPTION</th>
              <th style={{ ...styles.th, textAlign: 'center', width: '60px' }}>QTY</th>
              <th style={{ ...styles.th, textAlign: 'right', width: '110px' }}>RATE (₹)</th>
              <th style={{ ...styles.th, textAlign: 'right', width: '110px' }}>AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody style={styles.tbody}>
            {items.map((item, index) => {
              const itemTotal = (parseFloat(item.hours) * parseFloat(item.rate)) || 0;
              return (
                <tr key={index} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{item.description || 'Service/Product Description'}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{item.hours || '0'}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatINR(item.rate)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{formatINR(itemTotal)}</td>
                </tr>
              );
            })}

            {/* Fill space if few items */}
            {items.length < 5 && Array(5 - items.length).fill(0).map((_, i) => (
              <tr key={`empty-${i}`} style={{ ...styles.tr, borderBottom: '1px solid #f9fafb' }}>
                <td style={{ ...styles.td, height: '35px' }}>&nbsp;</td>
                <td style={styles.td}>&nbsp;</td>
                <td style={styles.td}>&nbsp;</td>
                <td style={styles.td}>&nbsp;</td>
                <td style={styles.td}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary and Signature */}
        <div style={styles.summarySection}>
          <div style={styles.signatureContainer}>
            <div style={styles.signatureLine}>AUTHORIZE SIGNATURE</div>
          </div>
          <div style={styles.totalsContainer}>
            <div style={styles.totalRow}>
              <span style={{ color: '#4b5563', fontWeight: 'bold' }}>Subtotal</span>
              <span style={{ color: '#111827' }}>₹ {formatINR(subtotal)}</span>
            </div>
            <div style={styles.totalRow}>
              <span style={{ color: '#4b5563', fontWeight: 'bold' }}>Discount ({discountRate}%)</span>
              <span style={{ color: '#ef4444' }}>- ₹ {formatINR(discountAmount)}</span>
            </div>
            <div style={{ ...styles.totalRow, borderTop: '1px solid #e5e7eb', marginTop: '5px', paddingTop: '10px' }}>
              <span style={{ color: '#1f7396', fontWeight: 'bold' }}>Total Amount</span>
              <span style={{ color: '#1f7396', fontWeight: 'bold' }}>₹ {formatINR(totalAmount)}</span>
            </div>
            <div style={styles.totalRow}>
              <span style={{ color: '#4b5563', fontWeight: 'bold' }}>Amount Paid</span>
              <span style={{ color: '#111827' }}>₹ {formatINR(amountPaid || 0)}</span>
            </div>
            <div style={styles.balanceBlock}>
              <div style={styles.balanceRow}>
                <span>BALANCE DUE</span>
                <span>₹ {formatINR(balanceDue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div style={styles.footerBanner}>
        <div>Designed and developed by Syed Tanzeel Maqsood</div>
        <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>Thank you for your business!</div>
      </div>
    </div>
  );
});

export default InvoicePreview;

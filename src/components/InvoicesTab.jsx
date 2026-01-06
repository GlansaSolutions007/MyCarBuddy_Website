import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import "./InvoicesTab.css";
import { FaFileInvoiceDollar, FaDownload, FaCalendarAlt, FaReceipt, FaRupeeSign, FaInfoCircle } from "react-icons/fa";

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BaseURL = process.env.REACT_APP_CARBUDDY_BASE_URL;
  const InvoiceURL = "https://api.mycarsbuddy.com/";
  const user = JSON.parse(localStorage.getItem("user"));
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
  const decryptedCustId = bytes.toString(CryptoJS.enc.Utf8);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BaseURL}Payments?custid=${decryptedCustId}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        // Filter only payments that have invoice numbers
        const invoicesWithNumbers = response.data.filter(
          (payment) => payment.InvoiceNumber !== null && payment.InvoiceNumber !== ""
        );

        setInvoices(invoicesWithNumbers);
        setError(null);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to load invoices. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchInvoices();
    }
  }, [BaseURL, user?.token]);

  const handleDownload = (folderPath, invoiceNumber) => {
    if (folderPath) {
      // Assuming FolderPath contains the full URL or relative path to the invoice file
      const downloadUrl = folderPath.startsWith('http')
        ? folderPath
        : `${InvoiceURL}${folderPath}`;

      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Invoice_${invoiceNumber}.pdf`; // Assuming PDF format
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="inv-section">
      {/* Header */}
      <div className="inv-header">
        <h2 className="inv-title">
          <span className="inv-title-icon">
            <FaFileInvoiceDollar />
          </span>
          My Invoices
        </h2>
        {invoices.length > 0 && (
          <span className="inv-count">{invoices.length} Invoice{invoices.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? (
        <div className="inv-loading">
          <div className="inv-spinner"></div>
          <span className="inv-loading-text">Loading invoices...</span>
        </div>
      ) : error ? (
        <div className="inv-empty">
          <img
            src="/assets/img/no-invoice.png"
            alt="No Invoices"
            className="inv-empty-img"
          />
          <h4>Failed to load invoices</h4>
          <p>Please try again.</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="inv-empty">
          <img
            src="/assets/img/noinvoice.png"
            alt="No Invoices"
            className="inv-empty-img"
          />
          <h4>No invoices yet</h4>
          <p>You haven't received any invoices yet. Check back after your next service!</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="inv-grid">
            {invoices.map((invoice) => (
              <div key={invoice.PaymentID} className="inv-card">
                <div className="inv-card-header">
                  <div className="inv-card-number">
                    <div className="inv-card-icon">
                      <FaFileInvoiceDollar />
                    </div>
                    <h4>{invoice.InvoiceNumber}</h4>
                  </div>
                  <div className="inv-card-date">
                    <FaCalendarAlt /> {formatDate(invoice.PaymentDate)}
                  </div>
                </div>

                <div className="inv-card-body">
                  <div className="inv-card-details">
                    <div className="inv-detail-item">
                      <div className="inv-detail-label">Booking ID</div>
                      <div className="inv-detail-value">{invoice.BookingTrackID}</div>
                    </div>
                    <div className="inv-detail-item">
                      <div className="inv-detail-label">Amount Paid</div>
                      <div className="inv-detail-value amount">₹{invoice.AmountPaid.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="inv-card-footer">
                    {invoice.FolderPath ? (
                      <button
                        className="inv-download-btn"
                        onClick={() => handleDownload(invoice.FolderPath, invoice.InvoiceNumber)}
                      >
                        <FaDownload /> Download Invoice
                      </button>
                    ) : (
                      <span className="inv-not-available">Invoice not available</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Invoice Date</th>
                  <th>Booking ID</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.PaymentID}>
                    <td>
                      <span className="inv-table-number">{invoice.InvoiceNumber}</span>
                    </td>
                    <td>{formatDate(invoice.PaymentDate)}</td>
                    <td>{invoice.BookingTrackID}</td>
                    <td>
                      <span className="inv-table-amount">₹{invoice.AmountPaid.toFixed(2)}</span>
                    </td>
                    <td>
                      {invoice.FolderPath ? (
                        <button
                          className="inv-table-btn"
                          onClick={() => handleDownload(invoice.FolderPath, invoice.InvoiceNumber)}
                        >
                          <FaDownload /> Download
                        </button>
                      ) : (
                        <span className="inv-not-available">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="inv-footer-info">
            <FaInfoCircle />
            Showing {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} with invoice numbers
          </div>
        </>
      )}
    </div>
  );
};

export default InvoicesTab;

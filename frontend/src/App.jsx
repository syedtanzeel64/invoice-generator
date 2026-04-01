import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LogIn, UserPlus, LogOut, Download, Save, Plus, Trash2, Clock, Upload } from 'lucide-react';
import InvoicePreview from './components/InvoicePreview';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [isLoginView, setIsLoginView] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [invoices, setInvoices] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const defaultInvoice = () => ({
    id: null,
    invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
    dateOfIssue: new Date().toISOString().split('T')[0],
    billToName: '',
    billToAddress: '',
    billToPhone: '',
    billToEmail: '',
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyPhone: '',
    companyEmail: '',
    logoUrl: '',
    items: [{ id: Date.now(), description: '', hours: 0, rate: 0 }],
    discountRate: 0,
    amountPaid: 0,
  });

  const [currentInvoice, setCurrentInvoice] = useState(defaultInvoice());

  const printRef = useRef();

  useEffect(() => {
    if (token) {
      fetchInvoices();
    }
  }, [token]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_URL}/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? '/auth/login' : '/auth/register';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (!isLoginView) {
          setIsLoginView(true);
          alert('Registered! Please sync to login.');
        } else {
          setToken(data.token);
          setUsername(data.username);
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
        }
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server. Is it running?');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setInvoices([]);
    setCurrentInvoice(defaultInvoice());
  };

  const loadInvoice = (inv) => {
    setCurrentInvoice({
      id: inv.id,
      invoiceNumber: inv.invoice_number || '',
      dateOfIssue: inv.date_issued || '',
      billToName: inv.client_name || '',
      billToAddress: inv.client_address || '',
      billToPhone: inv.client_phone || '',
      billToEmail: inv.client_email || '',
      companyName: inv.company_name || '',
      companyAddress: inv.company_address || '',
      companyCity: '', // Note: DB doesn't have city split out, but we map it if we can
      companyPhone: inv.company_phone || '',
      companyEmail: inv.company_email || '',
      logoUrl: inv.logo_url || '',
      items: inv.items_json && inv.items_json.length > 0 ? inv.items_json : defaultInvoice().items,
      discountRate: inv.discount_rate || 0,
      amountPaid: inv.amount_paid || 0,
    });
    setShowHistory(false);
  };

  const handleSaveInvoice = async () => {
    try {
      const subtotal = currentInvoice.items.reduce((sum, item) => sum + (parseFloat(item.hours) * parseFloat(item.rate) || 0), 0);
      const discountAmount = subtotal * (parseFloat(currentInvoice.discountRate) / 100 || 0);
      const taxAmount = 0; // Tax removed per user request
      const total = subtotal - discountAmount;

      const payload = {
        invoice_number: currentInvoice.invoiceNumber,
        client_name: currentInvoice.billToName,
        client_address: currentInvoice.billToAddress,
        client_phone: currentInvoice.billToPhone,
        client_email: currentInvoice.billToEmail,
        company_name: currentInvoice.companyName,
        company_address: currentInvoice.companyAddress,
        company_phone: currentInvoice.companyPhone,
        company_email: currentInvoice.companyEmail,
        date_issued: currentInvoice.dateOfIssue,
        subtotal,
        discount_rate: currentInvoice.discountRate,
        tax_rate: 0,
        tax_amount: 0,
        total,
        items_json: currentInvoice.items,
        logo_url: currentInvoice.logoUrl,
        amount_paid: currentInvoice.amountPaid
      };

      const res = await fetch(currentInvoice.id ? `${API_URL}/invoices/${currentInvoice.id}` : `${API_URL}/invoices`, {
        method: currentInvoice.id ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert(currentInvoice.id ? 'Invoice updated successfully!' : 'Invoice saved successfully to history!');
        fetchInvoices();
      } else {
        const errorData = await res.json();
        alert('Error saving invoice: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving invoice');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchInvoices();
        if (currentInvoice.id === id) {
           setCurrentInvoice(defaultInvoice()); // Clear editor if actively selected
        }
      } else {
        alert('Failed to delete invoice');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element || isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    try {
      // Setup for high quality PDF capturing scaling up layout
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('invoice-capture-area');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.margin = '0';
            // Ensure no inherited scales from parent containers in the clone
            let parent = clonedElement.parentElement;
            while (parent) {
              parent.style.transform = 'none';
              parent.style.margin = '0';
              parent.style.padding = '0';
              parent = parent.parentElement;
            }
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      
      // A4 paper dimensions: 210mm x 297mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${currentInvoice.invoiceNumber || 'invoice'}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...currentInvoice.items];
    newItems[index][field] = value;
    setCurrentInvoice(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setCurrentInvoice(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', hours: 0, rate: 0 }]
    }));
  };

  const removeItem = (index) => {
    const newItems = currentInvoice.items.filter((_, i) => i !== index);
    setCurrentInvoice(prev => ({ ...prev, items: newItems }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          alert("Logo file is too large! Please upload a smaller image.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('logoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Tanzeels Invoice Generator</h1>
            <p className="text-gray-500 mt-2">{isLoginView ? 'Welcome back! Please login.' : 'Create your free account.'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={authForm.username}
                onChange={e => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={authForm.password}
                onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex justify-center items-center gap-2"
            >
              {isLoginView ? <LogIn size={20} /> : <UserPlus size={20} />}
              {isLoginView ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLoginView(!isLoginView)} 
              className="text-blue-600 hover:underline font-medium"
            >
              {isLoginView ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 text-white p-2 rounded-lg cursor-pointer" onClick={() => setShowHistory(false)}>
               <span className="font-bold text-xl">IG</span>
             </div>
             <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Tanzeels Invoice Generator</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${showHistory ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Clock size={16} /> History ({invoices.length})
            </button>
            <span className="text-sm font-medium text-gray-400 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-gray-600 hidden sm:inline">Hi, {username}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex gap-8 flex-wrap lg:flex-nowrap relative">
        
        {showHistory && (
          <div className="absolute inset-0 z-20 bg-gray-50 p-4 sm:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Saved Invoices History</h2>
               <button onClick={() => setShowHistory(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Back to Editor</button>
            </div>
            
            {invoices.length === 0 ? (
               <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 mb-4">You haven't saved any invoices yet.</p>
                  <button onClick={() => setShowHistory(false)} className="text-blue-600 hover:underline font-medium">Create your first invoice</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invoices.map((inv) => (
                     <div key={inv.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition group cursor-pointer" onClick={() => loadInvoice(inv)}>
                        <div className="flex justify-between items-start mb-3">
                           <span className="font-bold text-blue-700">{inv.invoice_number}</span>
                           <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">{inv.date_issued}</span>
                        </div>
                        <h3 className="text-gray-800 font-semibold mb-1 truncate">{inv.client_name || 'No Client Name'}</h3>
                        <p className="text-sm text-gray-500 mb-4">Total: ₹ {parseFloat(inv.total||0).toFixed(2).toLocaleString('en-IN')}</p>
                        <div className="flex justify-between items-center">
                          <button className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open Invoice <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv.id); }} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="Delete"><Trash2 size={16}/></button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
          </div>
        )}

        {/* Editor Sidebar */}
        <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col gap-6" style={{ display: showHistory ? 'none' : 'flex' }}>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-5 h-auto lg:h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
            <div>
              <div className="flex justify-between border-b pb-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Invoice Details</h2>
                  <button onClick={() => setCurrentInvoice(defaultInvoice())} className="text-xs text-blue-600 font-semibold hover:underline bg-blue-50 px-2 py-1 rounded">New Blank</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Number</label>
                  <input type="text" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.invoiceNumber} onChange={e => handleInputChange('invoiceNumber', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                  <input type="date" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.dateOfIssue} onChange={e => handleInputChange('dateOfIssue', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Your Company</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:bg-gray-100 transition relative">
                   {currentInvoice.logoUrl ? (
                       <div className="flex flex-col items-center gap-2">
                          <img src={currentInvoice.logoUrl} alt="Logo" className="h-10 object-contain" />
                          <button onClick={() => handleInputChange('logoUrl', '')} className="text-xs text-red-500 hover:text-red-700">Remove Logo</button>
                       </div>
                   ) : (
                       <label className="cursor-pointer flex flex-col items-center text-gray-500 hover:text-blue-600">
                          <Upload size={20} className="mb-1" />
                          <span className="text-xs font-medium">Upload Free Logo (Max 2MB)</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                       </label>
                   )}
                </div>
                <input type="text" placeholder="Company Name" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.companyName} onChange={e => handleInputChange('companyName', e.target.value)} />
                <input type="text" placeholder="Street Address" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.companyAddress} onChange={e => handleInputChange('companyAddress', e.target.value)} />
                <input type="text" placeholder="City, State, Zip/Postal" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.companyCity} onChange={e => handleInputChange('companyCity', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Phone" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.companyPhone} onChange={e => handleInputChange('companyPhone', e.target.value)} />
                  <input type="email" placeholder="Email" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.companyEmail} onChange={e => handleInputChange('companyEmail', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Bill To (Client)</h2>
              <div className="space-y-3">
                <input type="text" placeholder="Client Name" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.billToName} onChange={e => handleInputChange('billToName', e.target.value)} />
                <input type="text" placeholder="Address" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.billToAddress} onChange={e => handleInputChange('billToAddress', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Phone" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.billToPhone} onChange={e => handleInputChange('billToPhone', e.target.value)} />
                  <input type="email" placeholder="Email" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.billToEmail} onChange={e => handleInputChange('billToEmail', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Items</h2>
              <div className="space-y-4">
                {currentInvoice.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg border group relative">
                    <button onClick={() => removeItem(idx)} className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    <input type="text" placeholder="Description" className="w-full text-sm border rounded p-2 mb-2 focus:ring-1 focus:ring-blue-500 bg-white" value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} />
                    <div className="flex gap-2">
                       <input type="number" placeholder="Quantity" className="w-1/2 text-sm border rounded p-2 focus:ring-1 focus:ring-blue-500 bg-white" value={item.hours} onChange={e => handleItemChange(idx, 'hours', e.target.value)} />
                       <input type="number" placeholder="Rate (₹)" className="w-1/2 text-sm border rounded p-2 focus:ring-1 focus:ring-blue-500 bg-white" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} />
                    </div>
                  </div>
                ))}
                <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800 transition flex items-center justify-center gap-1"><Plus size={16}/> Add Item</button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 space-y-3">
                    <div>
                       <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Rate (%)</label>
                       <input type="number" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.discountRate} onChange={e => handleInputChange('discountRate', e.target.value)} />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Already Paid (₹)</label>
                       <input type="number" className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500" value={currentInvoice.amountPaid} onChange={e => handleInputChange('amountPaid', e.target.value)} />
                    </div>
                 </div>
              </div>
            </div>

          </div>
          
          <div className="flex gap-3">
             <button onClick={handleSaveInvoice} className="flex-1 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2.5 rounded-lg transition duration-200 flex justify-center items-center gap-2 shadow-sm"><Save size={18}/> Save Invoice</button>
             <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className={`flex-1 ${isGeneratingPdf ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-2.5 rounded-lg transition duration-200 flex justify-center items-center gap-2 shadow-sm`}>
               {isGeneratingPdf ? <Plus size={18} className="animate-spin" /> : <Download size={18}/>}
               {isGeneratingPdf ? 'Generating...' : 'Export PDF'}
             </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-x-auto bg-gray-200 rounded-xl flex justify-center py-8 shadow-inner" style={{ minWidth: '850px', display: showHistory ? 'none' : 'flex' }}>
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
             <InvoicePreview invoiceData={currentInvoice} ref={printRef} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

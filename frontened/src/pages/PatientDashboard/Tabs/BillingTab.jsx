const BillingTab = () => {
  const bills = [
    { id: "INV-2026-042", date: "Mar 10, 2026", description: "Consultation - Dr. Sarah Johnson", amount: "$150.00", status: "Paid" },
    { id: "INV-2026-089", date: "Mar 12, 2026", description: "Diagnostic Lab Test - CBC", amount: "$45.00", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-48 h-48 -mr-10 -mt-10">
               <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
             </svg>
           </div>
           
           <h3 className="text-indigo-100 mb-1 font-medium">Total Balance Due</h3>
           <p className="text-4xl font-bold mb-6">$45.00</p>
           
           <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-lg font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
             Pay Now
           </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
            <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
            <div className="flex items-center p-3 border border-gray-200 rounded-lg mb-3">
               <div className="bg-blue-50 p-2 rounded mr-3">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                 </svg>
               </div>
               <div>
                  <p className="font-medium text-gray-800 text-sm">•••• 4242</p>
                  <p className="text-xs text-gray-500">Expires 12/28</p>
               </div>
            </div>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 text-left">
              + Add new payment method
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <h3 className="font-semibold text-gray-800">Billing History</h3>
           <button className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
             </svg>
             Export
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{bill.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{bill.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{bill.description}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{bill.amount}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingTab;

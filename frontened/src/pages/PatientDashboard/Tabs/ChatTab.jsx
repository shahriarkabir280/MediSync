const ChatTab = () => {
  return (
    <div className="h-[calc(100vh-12rem)] min-h-[500px] bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden">
      {/* Contact List Sidebar */}
      <div className="w-80 border-r border-gray-100 flex flex-col hidden md:flex">
         <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg mb-4">Messages</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-gray-50 border-none rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 absolute left-3 top-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto w-full">
            {/* Contact Item */}
            <div className="p-4 border-b border-gray-50 flex gap-3 cursor-pointer hover:bg-gray-50 bg-indigo-50/50 border-l-4 border-l-indigo-600">
               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                 SJ
               </div>
               <div className="flex-1 min-w-0 flex flex-col mt-0.5">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">Dr. Sarah Johnson</span>
                    <span className="text-xs text-indigo-600 font-medium whitespace-nowrap">10:42 AM</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">Your test results look great! We can...</p>
               </div>
            </div>
            
            {/* Contact Item */}
            <div className="p-4 border-b border-gray-50 flex gap-3 cursor-pointer hover:bg-gray-50 border-l-4 border-transparent">
               <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                   CS
                 </div>
                 <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
               </div>
               <div className="flex-1 min-w-0 flex flex-col mt-0.5">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">Support Team</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">Yesterday</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">How can we help you today?</p>
               </div>
            </div>
         </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-6 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                 SJ
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Dr. Sarah Johnson</h3>
                <p className="text-xs text-green-600 font-medium">Online</p>
              </div>
           </div>
           <button className="text-gray-400 hover:text-indigo-600 p-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
             </svg>
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {/* Received Message */}
           <div className="flex items-end gap-2 text-sm w-max max-w-[80%]">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 mb-1">SJ</div>
             <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-gray-700">
               <p>Hello! I've reviewed your latest complete blood count (CBC) test results from Mar 10.</p>
             </div>
           </div>
           
           <div className="flex items-end gap-2 text-sm w-max max-w-[80%]">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 mb-1 opacity-0">SJ</div>
             <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm text-gray-700">
               <p>Everything looks well within the normal ranges. You're doing great!</p>
               <span className="text-[10px] text-gray-400 mt-1 block text-right">10:41 AM</span>
             </div>
           </div>

           {/* Sent Message */}
           <div className="flex gap-2 text-sm w-max max-w-[80%] ml-auto justify-end">
             <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-sm">
               <p>That's a relief! Thank you so much, Doctor.</p>
               <span className="text-[10px] text-indigo-200 mt-1 block text-right">10:45 AM</span>
             </div>
           </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
           <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              <div className="flex-1 relative">
                 <input 
                   type="text" 
                   placeholder="Type a message..." 
                   className="w-full bg-gray-50 border-none rounded-full pl-4 pr-12 py-2.5 focus:ring-2 focus:ring-indigo-500/50 text-sm"
                 />
                 <button className="absolute right-1 top-1 bottom-1 p-1.5 flex items-center justify-center h-8 w-8 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-0.5">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;

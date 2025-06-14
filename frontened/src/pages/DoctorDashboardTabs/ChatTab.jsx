import React from "react";
import { User } from "lucide-react";
const Chattab = () => {
    return(
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Chat</h1>
              <p className="text-muted-foreground">Communicate with patients and colleagues.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Chat List */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Conversations</h3>
                <div className="space-y-2">
                  {[
                    { name: 'John Smith', message: 'Thank you for the consultation', time: '10:30 AM', unread: 2 },
                    { name: 'Mary Johnson', message: 'When should I take the medication?', time: '9:45 AM', unread: 0 },
                    { name: 'David Brown', message: 'Appointment confirmation needed', time: 'Yesterday', unread: 1 },
                  ].map((chat, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{chat.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{chat.time}</p>
                        {chat.unread > 0 && (
                          <span className="inline-block w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full text-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">John Smith</p>
                      <p className="text-sm text-green-600">Online</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="flex justify-start">
                    <div className="bg-accent p-3 rounded-lg max-w-xs">
                      <p className="text-sm">Hello Doctor, I have some questions about my medication.</p>
                      <p className="text-xs text-muted-foreground mt-1">10:25 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                      <p className="text-sm">Hi John! I'm happy to help. What would you like to know?</p>
                      <p className="text-xs text-primary-foreground/70 mt-1">10:26 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-accent p-3 rounded-lg max-w-xs">
                      <p className="text-sm">Should I take it before or after meals?</p>
                      <p className="text-xs text-muted-foreground mt-1">10:28 AM</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Type your message..."
                      className="flex-1 p-2 border border-input rounded-md bg-background"
                    />
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
    );
};
export default Chattab;

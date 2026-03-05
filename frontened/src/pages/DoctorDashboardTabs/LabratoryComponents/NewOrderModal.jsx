import React from 'react';
import { Plus } from "lucide-react";

const NewOrderModal = ({ setShowNewOrderModal }) => {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all border border-border">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                    <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                        <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                    New Test Order
                </h3>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Patient ID</label>
                        <input
                            type="text"
                            placeholder="Enter patient ID"
                            className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Clinical Notes</label>
                        <textarea
                            placeholder="Enter clinical notes"
                            className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium min-h-[100px] text-foreground placeholder:text-muted-foreground/50"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Priority</label>
                        <select className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground">
                            <option value="normal">Normal Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent Priority</option>
                        </select>
                    </div>
                </div>
                <div className="flex space-x-3 mt-8">
                    <button
                        onClick={() => {
                            alert('Order creation functionality - to be implemented');
                            setShowNewOrderModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 font-bold active:scale-95"
                    >
                        Create Order
                    </button>
                    <button
                        onClick={() => setShowNewOrderModal(false)}
                        className="px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-all font-medium bg-card"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewOrderModal;

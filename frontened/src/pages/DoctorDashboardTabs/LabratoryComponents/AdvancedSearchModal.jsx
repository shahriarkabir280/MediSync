import React from 'react';
import { Filter, User, Search } from "lucide-react";

const AdvancedSearchModal = ({ setShowSearchModal }) => {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-8 w-full max-w-lg shadow-2xl transition-all border border-border">
                <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                    <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                        <Filter className="w-5 h-5 text-blue-600" />
                    </div>
                    Advanced Search
                </h3>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Patient Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground/50" />
                            <input
                                type="text"
                                placeholder="Enter patient name"
                                className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Order Number</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground/50" />
                            <input
                                type="text"
                                placeholder="Enter order number"
                                className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Status</label>
                            <select className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground">
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Priority</label>
                            <select className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground">
                                <option value="">All Priorities</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Date From</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Date To</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium text-foreground"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3 mt-8">
                    <button
                        onClick={() => {
                            alert('Advanced search functionality - to be implemented');
                            setShowSearchModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 font-bold active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <Search className="w-5 h-5" />
                        <span>Search Orders</span>
                    </button>
                    <button
                        onClick={() => setShowSearchModal(false)}
                        className="px-6 py-3 border border-border text-foreground rounded-xl hover:bg-muted transition-all font-medium bg-card"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearchModal;

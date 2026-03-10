import React, { memo } from 'react';
import { Plus, Sparkles, FlaskConical, User, Activity } from "lucide-react";

const LabratoryHeader = memo(({ activeTab, setActiveTab, onNewOrder }) => {
    return (
        <div className="bg-card sticky top-0 z-30 border-b border-border shadow-sm">
            <div className="max-w-[1600px] mx-auto p-6 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground mb-1">
                                Laboratory Management
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Diagnostic center and clinical report management
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onNewOrder}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Test Order</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-[1600px] mx-auto px-6 flex space-x-1 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
                    { id: 'patients', label: 'Patients', icon: <User className="w-4 h-4" /> },
                    { id: 'orders', label: 'Orders', icon: <FlaskConical className="w-4 h-4" /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 pb-4 flex items-center space-x-2 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

export default LabratoryHeader;

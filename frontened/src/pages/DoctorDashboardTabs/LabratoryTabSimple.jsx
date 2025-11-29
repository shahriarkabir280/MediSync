import React from "react";
import { Flask } from "lucide-react";

const LabratoryTabSimple = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center">
        <Flask className="mr-3 text-purple-600" size={32} />
        Laboratory Management - Simple Test
      </h1>
      <p className="text-gray-600 mt-4">This is a simple test component to verify rendering.</p>
      
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Component Status</h2>
        <div className="space-y-2">
          <p>✅ Component is rendering</p>
          <p>✅ Icons are loading</p>
          <p>✅ Styles are applying</p>
        </div>
      </div>
    </div>
  );
};

export default LabratoryTabSimple;
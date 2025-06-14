import {useState} from "react";
import { User, FlaskConical } from "lucide-react";

const LabratoryTab = () => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Laboratory Management</h1>
                <p className="text-muted-foreground">Comprehensive patient lab reports, prescriptions, and clinical decision support.</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  New Test Order
                </button>
                <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  Bulk Actions
                </button>
              </div>
            </div>

            {/* Laboratory Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Today's Reports</h4>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1">24</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-red-600">8 Pending</span>
                  <span className="text-yellow-600">6 Processing</span>
                  <span className="text-green-600">10 Done</span>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Urgent Reports</h4>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold mb-1 text-red-600">5</p>
                <p className="text-sm text-muted-foreground">Require immediate attention</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Unreviewed</h4>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1 text-orange-600">12</p>
                <p className="text-sm text-muted-foreground">Awaiting doctor review</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">This Week</h4>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1">156</p>
                <p className="text-sm text-green-600">+23% from last week</p>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
                {[
                  { label: 'Urgent', count: 5, color: 'bg-red-100 text-red-800 border-red-200' },
                  { label: 'Processing', count: 12, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { label: 'Unreviewed', count: 8, color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { label: 'Done Today', count: 15, color: 'bg-green-100 text-green-800 border-green-200' },
                  { label: 'Critical Values', count: 3, color: 'bg-purple-100 text-purple-800 border-purple-200' }
                ].map((filter) => (
                  <button
                    key={filter.label}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors hover:opacity-80 ${filter.color}`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Selection */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Patient Selection & Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Search by patient name, ID, or phone..."
                    className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <select className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option>All Departments</option>
                    <option>Cardiology</option>
                    <option>Endocrinology</option>
                    <option>General Medicine</option>
                    <option>Nephrology</option>
                    <option>Hematology</option>
                  </select>
                </div>
                <div>
                  <select className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option>All Statuses</option>
                    <option>Urgent</option>
                    <option>Processing</option>
                    <option>Unreviewed</option>
                    <option>Done</option>
                  </select>
                </div>
              </div>
              
              {/* Priority Patients */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground">PRIORITY PATIENTS</h4>
                  <span className="text-xs text-red-600 font-medium">5 patients need immediate attention</span>
                </div>
                {[
                  { 
                    id: 'P001', 
                    name: 'Alice Wilson', 
                    age: 34, 
                    lastVisit: '2024-12-10', 
                    urgentReports: 2, 
                    status: 'Critical',
                    statusColor: 'bg-red-100 text-red-800 border-red-300'
                  },
                  { 
                    id: 'P002', 
                    name: 'Bob Chen', 
                    age: 45, 
                    lastVisit: '2024-12-09', 
                    urgentReports: 0, 
                    status: 'Processing',
                    statusColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  },
                  { 
                    id: 'P003', 
                    name: 'Carol Davis', 
                    age: 28, 
                    lastVisit: '2024-12-08', 
                    urgentReports: 1, 
                    status: 'Unreviewed',
                    statusColor: 'bg-orange-100 text-orange-800 border-orange-300'
                  },
                ].map((patient) => (
                  <div 
                    key={patient.id} 
                    className={`flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPatient?.id === patient.id ? 'bg-accent border-primary shadow-md' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{patient.name}</p>
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${patient.statusColor}`}>
                            {patient.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {patient.id} • Age: {patient.age} • Last Visit: {patient.lastVisit}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {patient.urgentReports > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-red-600">
                            {patient.urgentReports} Urgent
                          </span>
                        </div>
                      )}
                      <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        View Reports
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPatient && (
              <>
                {/* Enhanced Patient Overview */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${selectedPatient.statusColor}`}>
                            {selectedPatient.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-2">Patient ID: {selectedPatient.id} • Age: {selectedPatient.age}</p>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Active Patient</span>
                          </span>
                          <span className="text-muted-foreground">Last Visit: {selectedPatient.lastVisit}</span>
                          <span className="text-muted-foreground">Department: Endocrinology</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        New Test Order
                      </button>
                      <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                        Print Reports
                      </button>
                      <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced AI Clinical Decision Support */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Clinical Decision Support System</h3>
                      <p className="text-sm text-blue-700">AI-powered analysis of patient data</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Critical Alerts */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-red-900 mb-3 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>🚨 Critical Alerts</span>
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="font-medium text-red-800">Blood Sugar: 185 mg/dL ↑</p>
                          <p className="text-red-600 text-xs">Above target range (80-130 mg/dL)</p>
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-medium text-yellow-800">HbA1c: 6.8% ↑</p>
                          <p className="text-yellow-600 text-xs">Trending upward from 6.5%</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trends Analysis */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-3">📈 Trend Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Glucose Control</span>
                          <span className="text-red-600 font-medium">Worsening</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Cholesterol</span>
                          <span className="text-green-600 font-medium">Improving</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Blood Pressure</span>
                          <span className="text-blue-600 font-medium">Stable</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Recommendations */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-3">💡 AI Recommendations</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Consider increasing Metformin to 1000mg BID</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Continue current statin therapy</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span>Schedule HbA1c recheck in 3 months</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Enhanced Lab Reports Management */}
                <div className="bg-card border border-border rounded-lg">
                  <div className="border-b border-border">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: 'new-reports', label: 'New Reports', count: 3, color: 'bg-red-500' },
                        { id: 'processing', label: 'Processing', count: 2, color: 'bg-yellow-500' },
                        { id: 'history', label: 'Report History', count: 15, color: 'bg-blue-500' },
                        { id: 'prescriptions', label: 'Prescriptions', count: 8, color: 'bg-green-500' },
                        { id: 'trends', label: 'Trends & Analysis', count: null, color: 'bg-purple-500' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          className="flex items-center space-x-2 py-4 border-b-2 border-transparent hover:border-primary text-muted-foreground hover:text-foreground transition-colors relative"
                        >
                          <span>{tab.label}</span>
                          {tab.count && (
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${tab.color}`}></div>
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                                {tab.count}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Enhanced New Reports Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold flex items-center space-x-2">
                          <span>New Reports</span>
                          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Requires Attention</span>
                        </h4>
                        <div className="flex space-x-2">
                          <button className="text-sm text-primary hover:underline">Mark All as Reviewed</button>
                          <button className="text-sm border border-border px-3 py-1 rounded hover:bg-accent">Bulk Actions</button>
                        </div>
                      </div>
                      
                      {[
                        {
                          id: 'R001',
                          testName: 'Comprehensive Metabolic Panel',
                          date: '2024-12-10',
                          time: '09:15 AM',
                          status: 'Urgent',
                          statusColor: 'bg-red-500',
                          priority: 'High',
                          abnormal: ['Glucose: 185 mg/dL', 'HbA1c: 6.8%'],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Central Lab',
                          processingTime: '2h 30m'
                        },
                        {
                          id: 'R002',
                          testName: 'Lipid Profile Complete',
                          date: '2024-12-09',
                          time: '02:30 PM',
                          status: 'Processing',
                          statusColor: 'bg-yellow-500',
                          priority: 'Normal',
                          abnormal: [],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Cardio Lab',
                          processingTime: '45m'
                        },
                        {
                          id: 'R003',
                          testName: 'Complete Blood Count with Diff',
                          date: '2024-12-08',
                          time: '11:45 AM',
                          status: 'Done',
                          statusColor: 'bg-green-500',
                          priority: 'Normal',
                          abnormal: ['WBC: 11.2 K/μL'],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Hematology Lab',
                          processingTime: '1h 15m'
                        }
                      ].map((report) => (
                        <div key={report.id} className="border border-border rounded-lg p-5 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${
                                report.status === 'Urgent' ? 'bg-red-500 animate-pulse' : 
                                report.status === 'Processing' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <h5 className="font-semibold text-lg">{report.testName}</h5>
                              <span className="text-sm text-muted-foreground">#{report.id}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                report.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {report.priority} Priority
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right text-sm">
                                <p className="font-medium">{report.date} at {report.time}</p>
                                <p className="text-muted-foreground">Processing: {report.processingTime}</p>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                report.status === 'Urgent' ? 'bg-red-100 text-red-800' :
                                report.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {report.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <p className="text-sm"><span className="font-medium">Ordered by:</span> {report.doctor}</p>
                              <p className="text-sm"><span className="font-medium">Laboratory:</span> {report.lab}</p>
                              {report.abnormal.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-red-600 mb-1">Abnormal Values:</p>
                                  <div className="space-y-1">
                                    {report.abnormal.map((value, index) => (
                                      <span key={index} className="inline-block text-xs bg-red-50 text-red-700 px-2 py-1 rounded mr-2">
                                        {value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end items-start space-x-2">
                              <button className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                                View Details
                              </button>
                              <button className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                                Compare Previous
                              </button>
                              {report.status !== 'Done' && (
                                <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                                  Review & Sign
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick Results Preview */}
                          <div className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="text-sm font-medium">Key Results Summary</h6>
                              <button className="text-xs text-primary hover:underline">View Full Report</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">Glucose</span>
                                <span className={`font-semibold ${report.testName.includes('Metabolic') ? 'text-red-600' : 'text-green-600'}`}>
                                  {report.testName.includes('Metabolic') ? '185 mg/dL ↑' : '95 mg/dL'}
                                </span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">Cholesterol</span>
                                <span className="font-semibold text-green-600">180 mg/dL ↓</span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">HDL</span>
                                <span className="font-semibold">45 mg/dL</span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">LDL</span>
                                <span className="font-semibold">120 mg/dL</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Report History */}
                    <div className="mt-8 space-y-4">
                      <h4 className="text-lg font-semibold">Report History</h4>
                      <div className="space-y-2">
                        {[
                          { date: '2024-11-15', test: 'HbA1c Test', result: '6.5%', status: 'Reviewed' },
                          { date: '2024-10-20', test: 'Lipid Profile', result: 'Normal', status: 'Reviewed' },
                          { date: '2024-09-25', test: 'Blood Sugar', result: '160 mg/dL', status: 'Reviewed' },
                          { date: '2024-08-30', test: 'Complete Blood Count', result: 'Normal', status: 'Reviewed' },
                        ].map((historyItem, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-muted-foreground w-20">{historyItem.date}</span>
                              <span className="font-medium">{historyItem.test}</span>
                              <span className="text-sm">{historyItem.result}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {historyItem.status}
                              </span>
                              <button className="text-sm text-primary hover:underline">View</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prescription Writing */}
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Current Prescriptions</h4>
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                          Write New Prescription
                        </button>
                      </div>
                      
                      <div className="grid gap-4">
                        {[
                          {
                            medication: 'Metformin',
                            dosage: '500mg twice daily',
                            prescribed: '2024-11-15',
                            duration: '3 months',
                            remaining: '45 days'
                          },
                          {
                            medication: 'Atorvastatin',
                            dosage: '20mg once daily',
                            prescribed: '2024-10-20',
                            duration: '6 months',
                            remaining: '75 days'
                          }
                        ].map((prescription, index) => (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-lg">{prescription.medication}</h5>
                              <div className="flex space-x-2">
                                <button className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                                  Modify
                                </button>
                                <button className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200">
                                  Discontinue
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Dosage:</span> {prescription.dosage}
                              </div>
                              <div>
                                <span className="font-medium">Prescribed:</span> {prescription.prescribed}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {prescription.duration}
                              </div>
                              <div>
                                <span className="font-medium">Remaining:</span> {prescription.remaining}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!selectedPatient && (
              <div className="bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-lg p-16 text-center">
                <FlaskConical className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-muted-foreground mb-3">Select a Patient to Begin</h3>
                <p className="text-muted-foreground mb-4">Choose a patient from the priority list above to view their comprehensive lab reports, prescriptions, and clinical data.</p>
                <div className="flex justify-center space-x-3">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Search All Patients
                  </button>
                  <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                    Recent Reports
                  </button>
                </div>
              </div>
            )}
          </div>
    );
};
export default LabratoryTab;
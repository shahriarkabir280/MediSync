import React, { useState, useEffect } from "react";
import { 
  Stethoscope, FileText, Pill, Search, Download, Eye, Printer, Share2, Calendar, UserCircle, ChevronRight, Upload, X, Shield, AlertCircle
} from "lucide-react";
import { patientApi } from "../../../lib/api";
import { API_CONFIG } from "../../../config/api";
import { withAuthToken } from "../../../lib/authToken";
import toast from "react-hot-toast";

const DocumentCard = ({ record, formatDate }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
            {/* Card Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${
                            record.file_type === 'lab_result' ? 'bg-indigo-50 text-indigo-600' :
                            ['scan', 'xray', 'imaging'].includes(record.file_type) ? 'bg-emerald-50 text-emerald-600' :
                            'bg-blue-50 text-blue-600'
                        }`}>
                            <FileText size={16} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 truncate max-w-[150px]" title={record.file_name || 'Document'}>
                                {record.file_name || 'Clinical Document'}
                            </h4>
                            <p className="text-xs text-gray-500 capitalize mt-0.5 font-medium">
                                {record.file_type?.replace('_', ' ') || 'Record'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Body - Preview */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                {record.file_name && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 group-hover:border-indigo-500/30 transition-colors">
                        {/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name) ? (
                            <div 
                                className="cursor-pointer group/img relative"
                                onClick={() => window.open(withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`), '_blank')}
                            >
                                <img 
                                    src={withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`)} 
                                    alt="Document Preview"
                                    className="w-full h-32 object-contain transition-transform group-hover/img:scale-105"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.parentElement.nextSibling) {
                                            e.target.parentElement.nextSibling.style.display = 'flex';
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="text-white drop-shadow-md" size={24} />
                                </div>
                            </div>
                        ) : /\.pdf$/i.test(record.file_name) ? (
                            <div className="relative group/pdf cursor-pointer hover:bg-gray-100 transition-colors">
                                <div className="absolute inset-0 z-10" onClick={() => window.open(withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`), '_blank')}></div>
                                <iframe 
                                    src={withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}#toolbar=0&navpanes=0&scrollbar=0`)}
                                    className="w-full h-32 border-0 pointer-events-none opacity-80 group-hover/pdf:opacity-100 transition-opacity bg-white"
                                    title="PDF Preview"
                                />
                                <div className="absolute inset-0 bg-transparent flex items-center justify-center z-0">
                                     <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-800 opacity-0 group-hover/pdf:opacity-100 transition-opacity pointer-events-none transform translate-y-2 group-hover/pdf:translate-y-0 shadow-sm flex items-center gap-1.5">
                                         <Eye size={12} className="text-indigo-600" /> View PDF
                                     </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                    <FileText size={24} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500 font-bold">Click to download</p>
                                </div>
                            </div>
                        )}
                        <div className="hidden w-full h-32 items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <FileText size={24} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-xs text-gray-500 font-bold">Preview unavailable</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Meta Information */}
                <div>
                     <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                         <Calendar size={12} />
                         <p className="text-[10px] font-black uppercase tracking-wider">Date Added</p>
                     </div>
                     <p className="text-xs font-bold text-gray-900">{formatDate(record.record_date || record.created_at)}</p>
                </div>
            </div>

            {/* Card Actions */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
                <button 
                    onClick={() => {
                        window.open(withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`), '_blank');
                        toast.success('Downloading document...');
                    }}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-md transition-colors"
                    title="Download File"
                >
                    <Download size={15} />
                </button>
            </div>
        </div>
    );
};

const ReportsTab = ({ patient }) => {
  const [activeTab, setActiveTab] = useState('medical-history');
  const [loading, setLoading] = useState(!patient);
  const [selectedPatient, setSelectedPatient] = useState(patient);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentFilter, setDocumentFilter] = useState('all');

  // Fetch patient data and records
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patient?.id) return;
      
      setLoading(true);
      try {
        setSelectedPatient(patient);
        
        // Fetch medical history records
        const historyResponse = await patientApi.getMedicalHistory(patient.id);
        if (historyResponse && historyResponse.data) {
          setMedicalRecords(historyResponse.data);
        }
      } catch (error) {
        console.error("Error fetching patient records:", error);
        toast.error("Failed to load medical records.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patient]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium text-sm">Loading reports...</p>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <FileText size={32} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-bold text-gray-800">No Patient Record Found</h3>
        <p className="text-gray-500 max-w-sm mx-auto mt-2">Could not locate your medical records at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-gray-200">
          <div className="flex space-x-6 overflow-x-auto no-scrollbar pb-[-1px]">
              {[
                  { id: 'medical-history', label: 'History', icon: Stethoscope },
                  { id: 'records', label: 'Documents', icon: FileText },
                  { id: 'prescriptions', label: 'Prescriptions', icon: Pill }
              ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                  ? 'border-indigo-600 text-indigo-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                              }`}
                      >
                          <Icon size={16} />
                          <span>{tab.label}</span>
                      </button>
                  );
              })}
          </div>
      </div>

      <div className="min-h-[400px]">
          {/* Medical History Tab */}
          {activeTab === 'medical-history' && (
              <div className="space-y-6 animation-fade-in shadow-sm rounded-xl overflow-hidden p-6 bg-white border border-gray-100">
                  <div className="bg-white border-b border-gray-100 pb-5 mb-5">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Stethoscope size={18} />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-gray-900">Medical History</h3>
                              <p className="text-sm text-gray-500 mt-0.5">Chronological record of conditions</p>
                          </div>
                      </div>
                  </div>

                  {selectedPatient.medical_history ? (
                      <div className="space-y-4">
                          {selectedPatient.medical_history.split('\n').filter(line => line.trim()).map((entry, index) => (
                              <div key={index} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                      <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1.5 ring-4 ring-indigo-50"></div>
                                      <div className="w-px h-full bg-gray-200 my-2 last:hidden"></div>
                                  </div>
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 flex-1 mb-4 last:mb-0">
                                      <p className="text-sm text-gray-800 leading-relaxed">{entry}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-10 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                          <Stethoscope size={24} className="text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">No medical history recorded.</p>
                      </div>
                  )}

                  <div className="mt-8 bg-rose-50 border border-rose-100 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                              <AlertCircle size={18} />
                          </div>
                          <div>
                              <h3 className="text-base font-semibold text-rose-700">Allergies & Sensitivities</h3>
                          </div>
                      </div>

                      {selectedPatient.allergies ? (
                          <div className="flex flex-wrap gap-2">
                              {selectedPatient.allergies.split(',').map((allergy, index) => (
                                  <div key={index} className="bg-white border border-rose-200 rounded-md py-1.5 px-3 flex items-center gap-2 shadow-sm">
                                      <Shield size={14} className="text-rose-500" />
                                      <span className="text-sm font-medium text-rose-700">{allergy.trim()}</span>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-8 bg-emerald-50 rounded-lg border border-dashed border-emerald-200">
                              <Shield size={24} className="text-emerald-500 mx-auto mb-2 opacity-50" />
                              <p className="text-sm text-emerald-600">No known allergies reported.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'records' && (
              <div className="space-y-6 animation-fade-in p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  {/* Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <FileText size={18} />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-gray-900">Document Vault</h3>
                              <p className="text-sm text-gray-500 mt-0.5">Secure electronic records & imaging</p>
                          </div>
                      </div>

                      <div className="flex items-center gap-2">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input
                                  type="text"
                                  placeholder="Search documents..."
                                  value={documentSearch}
                                  onChange={(e) => setDocumentSearch(e.target.value)}
                                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
                              />
                          </div>
                      </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
                      {[
                          { id: 'all', label: 'All Files' },
                          { id: 'medical_record', label: 'Reports' },
                          { id: 'lab_result', label: 'Lab Results' },
                          { id: 'imaging', label: 'Imaging' },
                          { id: 'other', label: 'Other' }
                      ].map(filter => (
                          <button
                              key={filter.id}
                              onClick={() => setDocumentFilter(filter.id)}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${documentFilter === filter.id
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                  }`}
                          >
                              {filter.label}
                          </button>
                      ))}
                  </div>

                  {/* Documents Grid */}
                  {(() => {
                      const filteredDocs = medicalRecords.filter(r => {
                          const isNotPrescription = !r.prescription && r.file_type !== 'prescription';
                          const isImaging = ['scan', 'xray', 'imaging'].includes(r.file_type);
                          const isLab = r.file_type === 'lab_result';
                          const isReport = r.file_type === 'medical_record';

                          const matchesType = documentFilter === 'all'
                              ? true
                              : (
                                  (documentFilter === 'imaging' && isImaging) ||
                                  (documentFilter === 'lab_result' && isLab) ||
                                  (documentFilter === 'medical_record' && isReport) ||
                                  (documentFilter === 'other' && !isImaging && !isLab && !isReport)
                              );
                          const matchesSearch = r.file_name?.toLowerCase().includes(documentSearch.toLowerCase());
                          return isNotPrescription && matchesType && matchesSearch;
                      });

                      if (filteredDocs.length === 0) {
                          return (
                              <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                  <Search size={32} className="text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-600 font-medium text-lg">
                                      {documentSearch ? 'No matches found' : 'No documents found'}
                                  </p>
                                  {documentSearch && (
                                      <button
                                          onClick={() => setDocumentSearch('')}
                                          className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
                                      >
                                          Clear Search
                                      </button>
                                  )}
                              </div>
                          );
                      }

                      return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
                              {filteredDocs.map((record, index) => (
                                  <DocumentCard
                                      key={index}
                                      record={record}
                                      index={index}
                                      patient={selectedPatient}
                                      formatDate={formatDate}
                                  />
                              ))}
                          </div>
                      );
                  })()}
              </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
              <div className="space-y-6 animation-fade-in p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Pill size={18} />
                          </div>
                          <div>
                              <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-bold text-gray-900">Prescription Records</h3>
                                  <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-1.5 ml-2">
                                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs font-bold text-emerald-700">
                                          {medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length} Active
                                      </span>
                                  </div>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">Medication history & current prescriptions</p>
                          </div>
                      </div>

                      {/* Download All */}
                      <button
                          onClick={() => {
                              const prescriptions = medicalRecords.filter(r => r.prescription || r.file_type === 'prescription');
                              if (prescriptions.length === 0) {
                                  toast.error('No prescriptions to download');
                                  return;
                              }
                              let downloadCount = 0;
                              prescriptions.forEach((record, index) => {
                                  if (record.file_name) {
                                      setTimeout(() => {
                                          const link = document.createElement('a');
                                          link.href = withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`);
                                          link.download = record.file_name;
                                          link.target = '_blank';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                      }, index * 500);
                                      downloadCount++;
                                  }
                              });
                              if (downloadCount > 0) {
                                  toast.success(`Downloading ${downloadCount} prescription file(s)`);
                              }
                          }}
                          disabled={medicalRecords.filter(r => (r.prescription || r.file_type === 'prescription') && r.file_name).length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700 shadow-sm"
                      >
                          <Download size={16} />
                          <span>Download All</span>
                      </button>
                  </div>

                  {medicalRecords.filter(r => r.prescription || r.file_type === 'prescription').length === 0 ? (
                      <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                          <Pill size={32} className="text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium text-lg">No prescriptions found.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                          {medicalRecords
                              .filter(record => record.prescription || record.file_type === 'prescription')
                              .map((record, index) => (
                                  <div
                                      key={index}
                                      className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
                                  >
                                      {/* Card Header */}
                                      <div className="bg-gray-50/80 p-5 border-b border-gray-200">
                                          <div className="flex items-start justify-between">
                                              <div className="flex items-center gap-3">
                                                  <div className="p-2.5 bg-indigo-50 rounded-lg">
                                                      <Pill size={20} className="text-indigo-600" />
                                                  </div>
                                                  <div>
                                                      <div className="flex items-center gap-2 mb-1">
                                                          <h4 className="text-base font-bold text-gray-900">Prescription #{index + 1}</h4>
                                                          <div className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold text-emerald-800">
                                                              Active
                                                          </div>
                                                      </div>
                                                      <p className="text-sm text-gray-500 font-medium">
                                                          {record.file_name || 'Rx-' + (index + 1).toString().padStart(4, '0')}
                                                      </p>
                                                  </div>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                 <button
                                                      onClick={() => {
                                                          window.open(withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`), '_blank');
                                                          toast.success('Downloading prescription...');
                                                      }}
                                                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                                                      title="Download Prescription"
                                                  >
                                                      <Download size={16} />
                                                  </button>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Card Body - Prescription Details */}
                                      <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                                          {/* File Preview Section */}
                                          {record.file_name && (
                                              <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                                                  {/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(record.file_name) ? (
                                                      <div
                                                          className="cursor-pointer group/img relative"
                                                          onClick={() => window.open(withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`), '_blank')}
                                                      >
                                                          <img
                                                              src={withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`)}
                                                              alt={`Prescription ${index + 1}`}
                                                              className="w-full h-40 object-contain transition-transform group-hover/img:scale-105"
                                                          />
                                                      </div>
                                                  ) : /\.pdf$/i.test(record.file_name) ? (
                                                      <div className="relative group/pdf cursor-pointer hover:bg-gray-100 transition-colors">
                                                          <div className="absolute inset-0 z-10" onClick={() => window.open(withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}`), '_blank')}></div>
                                                          <iframe
                                                              src={withAuthToken(`${API_CONFIG.BASE_URL}/api/files/${record.file_name}#toolbar=0&navpanes=0&scrollbar=0`)}
                                                              className="w-full h-40 border-0 pointer-events-none opacity-80 group-hover/pdf:opacity-100 transition-opacity bg-white"
                                                              title={`Prescription ${index + 1}`}
                                                          />
                                                      </div>
                                                  ) : (
                                                      <div className="w-full h-40 flex items-center justify-center">
                                                          <div className="text-center">
                                                              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                                                              <p className="text-sm text-gray-500 font-medium">Preview not available</p>
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                          )}

                                          {/* Meta Information */}
                                          <div className="grid grid-cols-2 gap-4 mt-auto">
                                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                  <div className="flex items-center gap-2 mb-2">
                                                      <Calendar size={14} className="text-gray-400" />
                                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prescribed Date</p>
                                                  </div>
                                                  <p className="text-sm font-bold text-gray-900">{formatDate(record.record_date || record.created_at)}</p>
                                              </div>
                                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                  <div className="flex items-center gap-2 mb-2">
                                                      <UserCircle size={14} className="text-gray-400" />
                                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prescribed By</p>
                                                  </div>
                                                  <p className="text-sm font-bold text-gray-900 truncate">
                                                      {record.doctor_first_name ? `Dr. ${record.doctor_first_name}` : 'System'}
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default ReportsTab;

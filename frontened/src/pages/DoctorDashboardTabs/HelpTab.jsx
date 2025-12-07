import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, Book, FileText, HelpCircle, AlertCircle } from 'lucide-react';

const HelpTab = () => {
    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [supportForm, setSupportForm] = useState({
        subject: '',
        category: '',
        priority: 'medium',
        description: '',
        attachments: []
    });
    const [formSubmitted, setFormSubmitted] = useState(false);

    const faqData = [
        {
            id: 1,
            category: 'Account Management',
            question: 'How do I change my account password?',
            answer: 'Go to Settings > Account Security, enter your current password, then enter your new password twice to confirm the change.'
        },
        {
            id: 2,
            category: 'Appointments',
            question: 'How do I schedule appointments with patients?',
            answer: 'Navigate to the Appointments tab, click "Add New Appointment", fill in patient details, select date and time, then save.'
        },
        {
            id: 3,
            category: 'Billing',
            question: 'How do I set up payment methods?',
            answer: 'In Settings > Billing & Payment, click "Add Payment Method" and enter your payment information securely.'
        },
        {
            id: 4,
            category: 'Patient Records',
            question: 'How do I add patient medical records?',
            answer: 'In the Patients tab, select a patient, then click "Add Record" to upload documents or enter medical information.'
        },
        {
            id: 5,
            category: 'Security',
            question: 'How do I enable two-factor authentication?',
            answer: 'Go to Settings > Account Security, click "Enable 2FA", scan the QR code with your authenticator app, and enter the verification code.'
        },
        {
            id: 6,
            category: 'Technical Issues',
            question: 'The dashboard is loading slowly. What should I do?',
            answer: 'Try clearing your browser cache, check your internet connection, or switch to a different browser. Contact support if issues persist.'
        }
    ];

    const documentationLinks = [
        { title: 'Getting Started Guide', icon: Book, description: 'Complete setup and onboarding guide', url: '#' },
        { title: 'Patient Management', icon: FileText, description: 'Managing patient records and appointments', url: '#' },
        { title: 'Billing & Payments', icon: FileText, description: 'Setting up billing and payment processing', url: '#' },
        { title: 'API Documentation', icon: Book, description: 'Integration and API reference', url: '#' },
        { title: 'Security Best Practices', icon: AlertCircle, description: 'Keeping your account secure', url: '#' },
        { title: 'Troubleshooting', icon: HelpCircle, description: 'Common issues and solutions', url: '#' }
    ];

    const supportCategories = [
        { value: 'technical', label: 'Technical Issues' },
        { value: 'billing', label: 'Billing & Payments' },
        { value: 'account', label: 'Account Management' },
        { value: 'features', label: 'Feature Requests' },
        { value: 'other', label: 'Other' }
    ];

    const priorityLevels = [
        { value: 'low', label: 'Low', color: 'text-green-600' },
        { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
        { value: 'high', label: 'High', color: 'text-red-600' }
    ];

    const filteredFAQs = faqData.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the form data to your backend
        console.log('Support form submitted:', supportForm);
        setFormSubmitted(true);
        setSupportForm({ subject: '', category: '', priority: 'medium', description: '', attachments: [] });
        setTimeout(() => setFormSubmitted(false), 5000);
    };

    const toggleFAQ = (id) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const sections = [
        { id: 'faq', name: 'FAQ', icon: HelpCircle },
        { id: 'docs', name: 'Documentation', icon: Book },
        { id: 'contact', name: 'Contact Support', icon: Mail },
        { id: 'troubleshoot', name: 'Troubleshooting', icon: AlertCircle }
    ];

    return(
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Help & Support</h1>
                <p className="text-muted-foreground">Get help and find answers to common questions.</p>
            </div>
            
            {/* Navigation Tabs */}
            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="flex flex-wrap border-b border-gray-200">
                    {sections.map((section) => {
                        const IconComponent = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeSection === section.id
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <IconComponent className="mr-2 h-4 w-4 inline" />
                                {section.name}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {/* FAQ Section */}
                    {activeSection === 'faq' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
                            
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search FAQs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* FAQ Items */}
                            <div className="space-y-4">
                                {filteredFAQs.map((faq) => (
                                    <div key={faq.id} className="bg-gray-50 rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => toggleFAQ(faq.id)}
                                            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-100 transition-colors"
                                        >
                                            <div>
                                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                    {faq.category}
                                                </span>
                                                <h3 className="font-medium mt-2">{faq.question}</h3>
                                            </div>
                                            {expandedFAQ === faq.id ? 
                                                <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                                                <ChevronDown className="h-5 w-5 text-gray-400" />
                                            }
                                        </button>
                                        {expandedFAQ === faq.id && (
                                            <div className="px-4 pb-4">
                                                <p className="text-gray-600">{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredFAQs.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No FAQs found matching your search.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Documentation Section */}
                    {activeSection === 'docs' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Documentation & Guides</h2>
                            <p className="text-gray-600">Browse our comprehensive guides and tutorials.</p>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documentationLinks.map((doc, index) => {
                                    const IconComponent = doc.icon;
                                    return (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start space-x-3">
                                                <IconComponent className="h-6 w-6 text-blue-600 mt-1" />
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{doc.title}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2">
                                                        Read More →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Contact Support Section */}
                    {activeSection === 'contact' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Contact Support</h2>
                            
                            {/* Contact Options */}
                            <div className="grid md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-gray-900">Email Support</h3>
                                    <p className="text-sm text-gray-600 mt-1">support@careconnect.com</p>
                                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-gray-900">Phone Support</h3>
                                    <p className="text-sm text-gray-600 mt-1">+1 (555) 123-4567</p>
                                    <p className="text-xs text-gray-500">Mon-Fri 9AM-5PM EST</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                    <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-gray-900">Live Chat</h3>
                                    <p className="text-sm text-gray-600 mt-1">Chat with us</p>
                                    <p className="text-xs text-gray-500">Available now</p>
                                </div>
                            </div>

                            {/* Support Form */}
                            {formSubmitted && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-green-800">
                                                Support ticket submitted successfully!
                                            </p>
                                            <p className="text-sm text-green-700 mt-1">
                                                We'll get back to you within 24 hours.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={supportForm.subject}
                                            onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Brief description of your issue"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={supportForm.category}
                                            onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select a category</option>
                                            {supportCategories.map((cat) => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <div className="flex space-x-4">
                                        {priorityLevels.map((level) => (
                                            <label key={level.value} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value={level.value}
                                                    checked={supportForm.priority === level.value}
                                                    onChange={(e) => setSupportForm(prev => ({ ...prev, priority: e.target.value }))}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                />
                                                <span className={`ml-2 text-sm font-medium ${level.color}`}>
                                                    {level.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={supportForm.description}
                                        onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Please provide detailed information about your issue..."
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Submit Support Request
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Troubleshooting Section */}
                    {activeSection === 'troubleshoot' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">Troubleshooting</h2>
                            
                            <div className="space-y-6">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h3 className="font-medium text-yellow-800 mb-2">Common Issues & Solutions</h3>
                                    <div className="space-y-3 text-sm text-yellow-700">
                                        <div>
                                            <strong>Dashboard loading slowly:</strong>
                                            <ul className="list-disc list-inside mt-1 ml-4">
                                                <li>Clear your browser cache and cookies</li>
                                                <li>Check your internet connection speed</li>
                                                <li>Try using a different browser</li>
                                                <li>Disable browser extensions temporarily</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <strong>Unable to upload files:</strong>
                                            <ul className="list-disc list-inside mt-1 ml-4">
                                                <li>Check file size (max 10MB)</li>
                                                <li>Ensure file format is supported (PDF, DOC, JPG, PNG)</li>
                                                <li>Try uploading from a different browser</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <strong>Login issues:</strong>
                                            <ul className="list-disc list-inside mt-1 ml-4">
                                                <li>Verify your email and password are correct</li>
                                                <li>Check if Caps Lock is on</li>
                                                <li>Try resetting your password</li>
                                                <li>Ensure 2FA codes are current (if enabled)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-medium text-blue-800 mb-2">System Requirements</h3>
                                    <div className="text-sm text-blue-700 space-y-2">
                                        <div><strong>Supported Browsers:</strong> Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</div>
                                        <div><strong>Internet Connection:</strong> Minimum 1 Mbps for basic functionality</div>
                                        <div><strong>Screen Resolution:</strong> Minimum 1024x768 pixels</div>
                                        <div><strong>JavaScript:</strong> Must be enabled</div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-800 mb-2">Still Need Help?</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        If you're still experiencing issues after trying these solutions, please contact our support team.
                                    </p>
                                    <button
                                        onClick={() => setActiveSection('contact')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                    >
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div> 
    );
};
export default HelpTab;
import React, { useState } from "react";
import {
    Search,
    ChevronDown,
    ChevronUp,
    Mail,
    Phone,
    MessageCircle,
    Book,
    FileText,
    HelpCircle,
    AlertCircle,
    ArrowRight,
    ExternalLink,
    Clock,
    Shield
} from 'lucide-react';

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
        { title: 'Security Best Practices', icon: Shield, description: 'Keeping your account secure', url: '#' },
        { title: 'Troubleshooting', icon: AlertCircle, description: 'Common issues and solutions', url: '#' }
    ];

    const supportCategories = [
        { value: 'technical', label: 'Technical Issues' },
        { value: 'billing', label: 'Billing & Payments' },
        { value: 'account', label: 'Account Management' },
        { value: 'features', label: 'Feature Requests' },
        { value: 'other', label: 'Other' }
    ];

    const priorityLevels = [
        { value: 'low', label: 'Low', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' },
        { value: 'medium', label: 'Medium', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
        { value: 'high', label: 'High', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' }
    ];

    const filteredFAQs = faqData.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFormSubmit = (e) => {
        e.preventDefault();
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
        { id: 'docs', name: 'Guides', icon: Book },
        { id: 'contact', name: 'Support', icon: Mail },
        { id: 'troubleshoot', name: 'Troubleshoot', icon: AlertCircle }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-indigo-600 dark:bg-indigo-700 text-white p-8 md:p-12 shadow-xl shadow-indigo-100 dark:shadow-none">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">How can we help?</h1>
                    <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                        Find answers to common questions, browse through our guides, or get in touch with our expert support team.
                    </p>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-300 h-5 w-5 transition-colors group-focus-within:text-indigo-600" />
                        <input
                            type="text"
                            placeholder="Search for articles, questions, or guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white focus:text-gray-900 transition-all shadow-lg"
                        />
                    </div>
                </div>

                {/* Decorative background circle */}
                <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-card rounded-3xl p-2 shadow-sm border border-border flex flex-wrap gap-2">
                {sections.map((section) => {
                    const IconComponent = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-y-[-2px]'
                                    : 'text-muted-foreground hover:bg-muted font-medium'
                                }`}
                        >
                            <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                            <span className="font-semibold">{section.name}</span>
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[500px]">
                {/* FAQ Section */}
                {activeSection === 'faq' && (
                    <div className="grid lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold text-foreground">Popular Questions</h2>
                                <span className="text-sm text-muted-foreground">{filteredFAQs.length} results found</span>
                            </div>

                            <div className="space-y-4">
                                {filteredFAQs.map((faq) => (
                                    <div
                                        key={faq.id}
                                        className={`group bg-card rounded-2xl border transition-all duration-300 ${expandedFAQ === faq.id
                                                ? 'border-indigo-200 dark:border-indigo-500/40 ring-2 ring-indigo-50 dark:ring-indigo-900/20 shadow-md'
                                                : 'border-border hover:border-indigo-100 dark:hover:border-indigo-500/20 hover:shadow-sm'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleFAQ(faq.id)}
                                            className="w-full text-left p-6 flex justify-between items-center"
                                        >
                                            <div className="pr-4">
                                                <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                                                    {faq.category}
                                                </span>
                                                <h3 className="font-bold text-foreground text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {faq.question}
                                                </h3>
                                            </div>
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${expandedFAQ === faq.id ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                                }`}>
                                                {expandedFAQ === faq.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </div>
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ${expandedFAQ === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="px-6 pb-6 text-muted-foreground border-t border-border pt-4 leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredFAQs.length === 0 && (
                                    <div className="text-center py-20 bg-muted/20 dark:bg-muted/10 rounded-3xl border-2 border-dashed border-border">
                                        <div className="bg-card w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                            <Search className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">No results found</h3>
                                        <p className="text-muted-foreground">We couldn't find any questions matching "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-500/20">
                                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Still need help?
                                </h3>
                                <p className="text-indigo-800/80 dark:text-indigo-300/60 text-sm mb-6 leading-relaxed font-medium">
                                    Our support team is available Monday through Friday, 9:00 AM to 5:00 PM EST.
                                </p>
                                <button
                                    onClick={() => setActiveSection('contact')}
                                    className="w-full bg-background dark:bg-indigo-600 text-indigo-600 dark:text-white font-bold py-3 rounded-2xl shadow-sm border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition-all duration-300"
                                >
                                    Contact Support
                                </button>
                            </div>

                            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                                <h3 className="text-lg font-bold text-foreground mb-4">Popular Guides</h3>
                                <div className="space-y-4">
                                    {[0, 1, 2].map(i => (
                                        <a key={i} href="#" className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mr-3 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                                <Book className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                            </div>
                                            <div className="flex-1 border-b border-border pb-2 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/30">
                                                <p className="text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {documentationLinks[i].title}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documentation Section */}
                {activeSection === 'docs' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground mb-2">Documentation & Guides</h2>
                                <p className="text-muted-foreground">Everything you need to know about using CareConnect efficiently.</p>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors">
                                <Book className="h-5 w-5" />
                                Browse All Docs
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {documentationLinks.map((doc, index) => {
                                const IconComponent = doc.icon;
                                return (
                                    <div key={index} className="group bg-card border border-border rounded-3xl p-8 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-900/10 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all duration-300 flex flex-col h-full">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                                            <IconComponent className="h-7 w-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.title}</h3>
                                        <p className="text-muted-foreground mb-8 leading-relaxed flex-grow">{doc.description}</p>
                                        <button className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold hover:gap-2 transition-all">
                                            Read Guide <ArrowRight className="h-5 w-5 ml-1" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Contact Support Section */}
                {activeSection === 'contact' && (
                    <div className="grid lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-5 space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground mb-4">Get in touch</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Can’t find what you’re looking for? Reach out to our dedicated support team and we’ll get back to you as soon as possible.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start p-6 bg-card rounded-3xl border border-border shadow-sm">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                                        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">Email us</h3>
                                        <p className="text-sm text-muted-foreground mb-2">Our team will respond within 24 hours.</p>
                                        <a href="mailto:support@careconnect.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">support@careconnect.com</a>
                                    </div>
                                </div>

                                <div className="flex items-start p-6 bg-card rounded-3xl border border-border shadow-sm">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mr-4">
                                        <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">Call us</h3>
                                        <p className="text-sm text-muted-foreground mb-2">Mon-Fri from 9am to 6pm EST.</p>
                                        <a href="tel:+15551234567" className="text-green-600 dark:text-green-400 font-semibold hover:underline">+1 (555) 123-4567</a>
                                    </div>
                                </div>

                                <div className="flex items-start p-6 bg-card rounded-3xl border border-border shadow-sm">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mr-4">
                                        <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">Live Chat</h3>
                                        <p className="text-sm text-muted-foreground mb-2">Available for urgent inquiries.</p>
                                        <button className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Start a conversation</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="bg-card rounded-3xl p-8 border border-border shadow-xl shadow-indigo-900/5 dark:shadow-none">
                                {formSubmitted ? (
                                    <div className="text-center py-12 animate-in zoom-in duration-500">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Mail className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h3>
                                        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                            Thanks for reaching out. We've received your ticket and will get back to you within 24 hours.
                                        </p>
                                        <button
                                            onClick={() => setFormSubmitted(false)}
                                            className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-colors"
                                        >
                                            Send another message
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleFormSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-muted-foreground ml-1">
                                                    Subject
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={supportForm.subject}
                                                    onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-muted border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-muted-foreground text-foreground"
                                                    placeholder="What can we help with?"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-muted-foreground ml-1">
                                                    Category
                                                </label>
                                                <select
                                                    value={supportForm.category}
                                                    onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-muted border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all appearance-none cursor-pointer text-foreground"
                                                >
                                                    <option value="">Select a category</option>
                                                    {supportCategories.map((cat) => (
                                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-muted-foreground ml-1">
                                                Urgency level
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                {priorityLevels.map((level) => (
                                                    <button
                                                        key={level.value}
                                                        type="button"
                                                        onClick={() => setSupportForm(prev => ({ ...prev, priority: level.value }))}
                                                        className={`px-6 py-2 rounded-xl text-sm font-bold border transition-all ${supportForm.priority === level.value
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'bg-card text-muted-foreground border-border hover:border-indigo-400'
                                                            }`}
                                                    >
                                                        {level.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground ml-1">
                                                Description
                                            </label>
                                            <textarea
                                                required
                                                rows={5}
                                                value={supportForm.description}
                                                onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-4 py-3 bg-muted border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-muted-foreground resize-none text-foreground"
                                                placeholder="Please provide as much detail as possible..."
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                                        >
                                            Submit Request
                                            <ArrowRight className="h-5 w-5" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Troubleshooting Section */}
                {activeSection === 'troubleshoot' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-foreground mb-4">Troubleshooting</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Having technical difficulties? Here are some quick solutions to the most common issues reported by our users.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-card rounded-3xl p-8 border border-border shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <AlertCircle className="h-24 w-24 text-foreground" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">1</span>
                                    Common Issues & Solutions
                                </h3>
                                <div className="grid md:grid-cols-2 gap-8 text-muted-foreground">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-foreground mb-2">Dashboard loading slowly</h4>
                                            <p className="text-sm leading-relaxed">Try clearing your browser cache and cookies, or check your internet connection speed. Using Chrome is recommended.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground mb-2">Unable to upload files</h4>
                                            <p className="text-sm leading-relaxed">Check if file size exceeds 10MB. Ensure format is PDF, DOC, JPG or PNG. Try a private/incognito window.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-bold text-foreground mb-2">Login issues</h4>
                                            <p className="text-sm leading-relaxed">Verify your credentials. If you have 2FA enabled, ensure your device time is synchronized.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground mb-2">Missing patient data</h4>
                                            <p className="text-sm leading-relaxed">Refresh the page. If data still doesn't appear, check if filters are active in your patient dashboard.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 dark:bg-muted/10 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-border">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <Shield className="h-32 w-32" />
                                </div>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
                                    <span className="w-8 h-8 rounded-lg bg-white text-gray-900 flex items-center justify-center text-sm">2</span>
                                    System Requirements
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Browsers</p>
                                        <p className="text-sm font-semibold">Chrome, Safari</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Internet</p>
                                        <p className="text-sm font-semibold">5 Mbps +</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Resolution</p>
                                        <p className="text-sm font-semibold">1280 x 800</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-sm font-semibold flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            Operational
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-2">Still experiencing problems?</h3>
                                    <p className="text-indigo-800/70 dark:text-indigo-300/60 font-medium">Our technical team can help you diagnose and fix any platform issues.</p>
                                </div>
                                <button
                                    onClick={() => setActiveSection('contact')}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none shrink-0"
                                >
                                    Open Support Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpTab;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
    ArrowLeft, Calendar, Clock, Eye, Share2, Facebook, Twitter,
    Linkedin, Link as LinkIcon, Check
} from 'lucide-react';
import { API_URLS, getImageUrl } from '../config/api';

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchBlogPost();
    }, [slug]);

    const fetchBlogPost = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_URLS.WEBSITE.PUBLIC_BLOG(slug));
            const result = await response.json();

            if (result.success && result.data) {
                setBlog(result.data);
            } else {
                setError('Blog post not found');
            }
        } catch {
            setError('Failed to load blog post');
        } finally {
            setLoading(false);
        }
    };

    const shareUrl = window.location.href;
    const shareTitle = blog?.title || '';

    const handleShare = (platform) => {
        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading blog post...</p>
                </div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Blog Post Not Found</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 mr-2">Share:</span>
                        <button
                            onClick={() => handleShare('facebook')}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            title="Share on Facebook"
                        >
                            <Facebook className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                            onClick={() => handleShare('twitter')}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            title="Share on Twitter"
                        >
                            <Twitter className="w-5 h-5 text-sky-500" />
                        </button>
                        <button
                            onClick={() => handleShare('linkedin')}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            title="Share on LinkedIn"
                        >
                            <Linkedin className="w-5 h-5 text-blue-700" />
                        </button>
                        <button
                            onClick={copyLink}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors relative"
                            title="Copy link"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-600" /> : <LinkIcon className="w-5 h-5 text-slate-600" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Article */}
            <article className="max-w-4xl mx-auto px-4 py-12">
                {/* Category Badge */}
                {blog.category && (
                    <div className="mb-6">
                        <span className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full">
                            {blog.category}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                    {blog.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-slate-600 mb-8 pb-8 border-b border-slate-200">
                    {blog.published_at && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                                {new Date(blog.published_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    )}
                    {blog.read_time > 0 && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{blog.read_time} min read</span>
                        </div>
                    )}
                    {blog.views > 0 && (
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">{blog.views} views</span>
                        </div>
                    )}
                </div>

                {/* Featured Image */}
                {blog.featured_image && (
                    <div className="mb-12 rounded-2xl overflow-hidden">
                        <img
                            src={getImageUrl(blog.featured_image)}
                            alt={blog.title}
                            className="w-full h-auto"
                            onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop'}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-lg max-w-none prose-slate prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-img:rounded-2xl shadow-none">
                    {blog.excerpt && (
                        <p className="text-xl text-slate-600 leading-relaxed mb-8 font-medium italic border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/30 rounded-r-xl">
                            {blog.excerpt}
                        </p>
                    )}

                    <div className="text-slate-700 leading-relaxed space-y-4">
                        <ReactMarkdown>{blog.content}</ReactMarkdown>
                    </div>
                </div>

                {/* Share Section */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Share this article</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleShare('facebook')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Facebook className="w-4 h-4" />
                                <span className="text-sm font-medium">Facebook</span>
                            </button>
                            <button
                                onClick={() => handleShare('twitter')}
                                className="px-4 py-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors flex items-center gap-2"
                            >
                                <Twitter className="w-4 h-4" />
                                <span className="text-sm font-medium">Twitter</span>
                            </button>
                            <button
                                onClick={() => handleShare('linkedin')}
                                className="px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors flex items-center gap-2"
                            >
                                <Linkedin className="w-4 h-4" />
                                <span className="text-sm font-medium">LinkedIn</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default BlogPost;

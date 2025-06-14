
import React, { useState } from 'react';
import { BookOpen, Plus, Search, Filter, Calendar, Eye, Edit3, Trash2, BarChart3 } from 'lucide-react';

const BlogsTab = () => {
  // State for blogs
  const [blogs, setBlogs] = useState([
    {
      id: 1,
      title: "Understanding Heart Health",
      content: "Heart health is crucial for overall wellbeing...",
      excerpt: "Learn about the importance of cardiovascular health and prevention strategies.",
      author: "Dr. John Smith",
      publishDate: "2024-01-15",
      status: "published",
      category: "Cardiology",
      tags: ["heart", "health", "prevention"],
      readTime: "5 min read",
      views: 1250,
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Diabetes Management Tips",
      content: "Managing diabetes requires consistent care...",
      excerpt: "Essential tips for managing diabetes and maintaining quality of life.",
      author: "Dr. John Smith",
      publishDate: "2024-01-10",
      status: "draft",
      category: "Endocrinology",
      tags: ["diabetes", "management", "lifestyle"],
      readTime: "7 min read",
      views: 890,
      image: "/api/placeholder/400/200"
    }
  ]);

  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    status: 'draft',
    image: ''
  });

  const [editingBlog, setEditingBlog] = useState(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const blogCategories = [
    'Cardiology', 'Endocrinology', 'Neurology', 'Orthopedics', 
    'Pediatrics', 'Dermatology', 'General Health', 'Preventive Care'
  ];

  // Blog management functions
  const handleBlogFormChange = (field, value) => {
    setBlogForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateBlog = () => {
    const newBlog = {
      id: Date.now(),
      ...blogForm,
      author: "Dr. John Smith",
      publishDate: new Date().toISOString().split('T')[0],
      tags: blogForm.tags.split(',').map(tag => tag.trim()),
      readTime: Math.ceil(blogForm.content.length / 200) + " min read",
      views: 0,
      image: blogForm.image || "/api/placeholder/400/200"
    };

    setBlogs(prev => [newBlog, ...prev]);
    setBlogForm({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: '',
      status: 'draft',
      image: ''
    });
    setShowBlogForm(false);
    alert('Blog created successfully!');
  };

  const handleEditBlog = (blog) => {
    setEditingBlog(blog.id);
    setBlogForm({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: blog.category,
      tags: blog.tags.join(', '),
      status: blog.status,
      image: blog.image
    });
    setShowBlogForm(true);
  };

  const handleUpdateBlog = () => {
    setBlogs(prev => prev.map(blog => 
      blog.id === editingBlog 
        ? {
            ...blog,
            ...blogForm,
            tags: blogForm.tags.split(',').map(tag => tag.trim()),
            readTime: Math.ceil(blogForm.content.length / 200) + " min read"
          }
        : blog
    ));
    
    setEditingBlog(null);
    setBlogForm({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: '',
      status: 'draft',
      image: ''
    });
    setShowBlogForm(false);
    alert('Blog updated successfully!');
  };

  const handleDeleteBlog = (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      setBlogs(prev => prev.filter(blog => blog.id !== blogId));
      alert('Blog deleted successfully!');
    }
  };

  const handlePublishBlog = (blogId) => {
    setBlogs(prev => prev.map(blog => 
      blog.id === blogId 
        ? { ...blog, status: blog.status === 'published' ? 'draft' : 'published' }
        : blog
    ));
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || blog.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || blog.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage Blogs</h1>
          <p className="text-muted-foreground">Create, edit, and manage your blog posts to share medical insights with your patients.</p>
        </div>
        <button
          onClick={() => {
            setShowBlogForm(true);
            setEditingBlog(null);
            setBlogForm({
              title: '',
              content: '',
              excerpt: '',
              category: '',
              tags: '',
              status: 'draft',
              image: ''
            });
          }}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          New Blog Post
        </button>
      </div>

      {/* Blog Form Modal */}
      {showBlogForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Blog Title</label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => handleBlogFormChange('title', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter blog title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => handleBlogFormChange('category', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {blogCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={blogForm.status}
                    onChange={(e) => handleBlogFormChange('status', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={blogForm.tags}
                    onChange={(e) => handleBlogFormChange('tags', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="health, medicine, tips..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Excerpt</label>
                  <textarea
                    value={blogForm.excerpt}
                    onChange={(e) => handleBlogFormChange('excerpt', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-24 resize-none"
                    placeholder="Brief description of the blog post..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={blogForm.content}
                    onChange={(e) => handleBlogFormChange('content', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-64 resize-none"
                    placeholder="Write your blog content here..."
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowBlogForm(false);
                  setEditingBlog(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingBlog ? handleUpdateBlog : handleCreateBlog}
                disabled={!blogForm.title || !blogForm.content}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBlog ? 'Update Blog' : 'Create Blog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {blogCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <div className="flex items-center text-sm text-gray-600">
            <Filter size={16} className="mr-2" />
            {filteredBlogs.length} blog(s) found
          </div>
        </div>
      </div>

      {/* Blog Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Blogs</p>
              <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">
                {blogs.filter(blog => blog.status === 'published').length}
              </p>
            </div>
            <Eye className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-orange-600">
                {blogs.filter(blog => blog.status === 'draft').length}
              </p>
            </div>
            <Edit3 className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">
                {blogs.reduce((total, blog) => total + blog.views, 0)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Blog Posts</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredBlogs.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Get started by creating your first blog post.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && (
                <button
                  onClick={() => setShowBlogForm(true)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Your First Blog
                </button>
              )}
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{blog.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        blog.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{blog.excerpt}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {blog.publishDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {blog.views} views
                      </span>
                      <span>{blog.readTime}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{blog.category}</span>
                    </div>
                    
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {blog.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditBlog(blog)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    
                    <button
                      onClick={() => handlePublishBlog(blog.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        blog.status === 'published'
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      <Eye size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogsTab;

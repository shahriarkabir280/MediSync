
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { BookOpen, Plus, Search, Filter, Calendar, Eye, Edit3, Trash2, BarChart3 } from 'lucide-react';
import { api } from '../../lib/api';
import { debounce } from '../../utils/performance';

const BlogsTab = memo(() => {
  // State for blogs
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalComments: 0
  });

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

  // Memoize filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const matchesSearch = !searchTerm || blog.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || blog.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || blog.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [blogs, searchTerm, filterStatus, filterCategory]);

  // Fetch data on component mount
  useEffect(() => {
    fetchBlogPosts();
    fetchCategories();
    fetchStats();
  }, []);

  // API Functions
  const fetchBlogPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/blog/posts');
      
      // Handle different possible response structures
      const posts = response?.data?.posts || response?.posts || [];
      if (posts && posts.length > 0) {
        setBlogs(posts);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/blog/categories');
      const categories = response?.data?.categories || response?.categories || [];
      setCategories(categories);
    } catch (error) {
      setCategories([
        { id: 1, name: 'Cardiology', color: '#EF4444' },
        { id: 2, name: 'Endocrinology', color: '#10B981' },
        { id: 3, name: 'Mental Health', color: '#8B5CF6' },
        { id: 4, name: 'Preventive Care', color: '#3B82F6' },
        { id: 5, name: 'Nutrition', color: '#F59E0B' }
      ]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/blog/stats');
      const stats = response?.data?.stats || response?.stats || {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        totalComments: 0
      };
      setStats(stats);
    } catch (error) {
      // Use default stats on error
    }
  };

  const blogCategories = [
    'Cardiology', 'Endocrinology', 'Neurology', 'Orthopedics', 
    'Pediatrics', 'Dermatology', 'General Health', 'Preventive Care'
  ];

  // Blog management functions
  const handleBlogFormChange = (field, value) => {
    setBlogForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingBlog) {
      await handleUpdateBlog();
    } else {
      await handleCreateBlog();
    }
  };

  const handleCreateBlog = async () => {
    try {
      const blogData = {
        title: blogForm.title,
        content: blogForm.content,
        excerpt: blogForm.excerpt,
        status: blogForm.status,
        category: blogForm.category,
        tags: blogForm.tags.split(',').map(tag => tag.trim())
      };

      await api.post('/blog/posts', blogData);
      
      // Refresh blog posts after creating
      await fetchBlogPosts();
      await fetchStats();
      
      // Reset form
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
    } catch (error) {
      alert('Error creating blog post. Please try again.');
    }
  };

  const handleEditBlog = (blog) => {
    setEditingBlog(blog.id);
    setBlogForm({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category: blog.category,
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags || '',
      status: blog.status,
      image: blog.featured_image || ''
    });
    setShowBlogForm(true);
  };

  const handleUpdateBlog = async () => {
    try {
      const blogData = {
        title: blogForm.title,
        content: blogForm.content,
        excerpt: blogForm.excerpt,
        status: blogForm.status,
        category: blogForm.category,
        tags: blogForm.tags.split(',').map(tag => tag.trim())
      };

      await api.put(`/blog/posts/${editingBlog}`, blogData);
      
      // Refresh blog posts after updating
      await fetchBlogPosts();
      await fetchStats();
      
      // Reset form
      setBlogForm({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        status: 'draft',
        image: ''
      });
      setEditingBlog(null);
      setShowBlogForm(false);
    } catch (error) {
      alert('Error updating blog post. Please try again.');
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await api.delete(`/blog/posts/${blogId}`);
        await fetchBlogPosts();
        await fetchStats();
      } catch (error) {
        alert('Error deleting blog post. Please try again.');
      }
    }
  };

  const handlePublishBlog = async (blogId) => {
    try {
      // Find the current blog to get its data
      const currentBlog = blogs.find(blog => blog.id === blogId);
      if (!currentBlog) return;

      // Toggle publish status
      const newStatus = currentBlog.status === 'published' ? 'draft' : 'published';
      
      await api.put(`/blog/posts/${blogId}`, {
        ...currentBlog,
        status: newStatus,
        tags: Array.isArray(currentBlog.tags) ? currentBlog.tags : []
      });
      
      // Refresh blog posts after updating
      await fetchBlogPosts();
      await fetchStats();
    } catch (error) {
      alert('Error updating blog status. Please try again.');
    }
  };

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
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
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
          {loading ? (
            <div className="p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading blogs...</h3>
              <p className="text-gray-500">Please wait while we fetch your blog posts.</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
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
});

export default BlogsTab;

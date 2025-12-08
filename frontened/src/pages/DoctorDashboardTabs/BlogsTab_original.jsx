
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  BarChart3,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Settings,
  Tag,
  Clock,
  TrendingUp,
  Globe,
  FileText,
  Folder,
  PlusCircle
} from 'lucide-react';
import { api } from '../../lib/api';

const BlogsTab = () => {
  // State management
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalComments: 0
  });
  
  // Form states
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    tags: [],
    status: 'draft',
    featured_image: '',
    meta_title: '',
    meta_description: ''
  });
  
  // UI states
  const [editingBlog, setEditingBlog] = useState(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    limit: 10
  });
  
  const fileInputRef = useRef(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchBlogPosts();
    fetchCategories();
    fetchStats();
  }, [currentPage, filterStatus, filterCategory, searchTerm]);

  // API Functions
  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: filterStatus,
        category: filterCategory,
        search: searchTerm
      });
      
      const response = await api.get(`/blog/posts?${params}`);
      setBlogs(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      alert('Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/blog/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/blog/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Blog management functions
  const handleBlogFormChange = (field, value) => {
    setBlogForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/blog/upload/featured-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setBlogForm(prev => ({ ...prev, featured_image: response.data.imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!blogForm.tags.includes(newTag)) {
        setBlogForm(prev => ({ 
          ...prev, 
          tags: [...prev.tags, newTag] 
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setBlogForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCreateBlog = async () => {
    try {
      setLoading(true);
      const blogData = {
        ...blogForm,
        tags: blogForm.tags.length > 0 ? blogForm.tags : undefined
      };
      
      await api.post('/blog/posts', blogData);
      
      resetForm();
      setShowBlogForm(false);
      fetchBlogPosts();
      fetchStats();
      alert('Blog created successfully!');
    } catch (error) {
      console.error('Error creating blog:', error);
      alert('Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlog = async (blog) => {
    setEditingBlog(blog.id);
    setBlogForm({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      category_id: blog.category_id,
      tags: Array.isArray(blog.tags) ? blog.tags : 
            (typeof blog.tags === 'string' ? JSON.parse(blog.tags || '[]') : []),
      status: blog.status,
      featured_image: blog.featured_image || '',
      meta_title: blog.meta_title || blog.title,
      meta_description: blog.meta_description || blog.excerpt
    });
    setShowBlogForm(true);
  };

  const handleUpdateBlog = async () => {
    try {
      setLoading(true);
      const blogData = {
        ...blogForm,
        tags: blogForm.tags.length > 0 ? blogForm.tags : undefined
      };
      
      await api.put(`/blog/posts/${editingBlog}`, blogData);
      
      resetForm();
      setEditingBlog(null);
      setShowBlogForm(false);
      fetchBlogPosts();
      fetchStats();
      alert('Blog updated successfully!');
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/blog/posts/${blogId}`);
      fetchBlogPosts();
      fetchStats();
      alert('Blog deleted successfully!');
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    } finally {
      setLoading(false);
    }
  };

  // Category management functions
  const handleCreateCategory = async () => {
    try {
      setLoading(true);
      await api.post('/blog/categories', categoryForm);
      
      setCategoryForm({ name: '', description: '', color: '#3B82F6' });
      setShowCategoryForm(false);
      fetchCategories();
      alert('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.error || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6'
    });
    setShowCategoryForm(true);
  };

  const handleUpdateCategory = async () => {
    try {
      setLoading(true);
      await api.put(`/blog/categories/${editingCategory}`, categoryForm);
      
      setCategoryForm({ name: '', description: '', color: '#3B82F6' });
      setEditingCategory(null);
      setShowCategoryForm(false);
      fetchCategories();
      alert('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      alert(error.response?.data?.error || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/blog/categories/${categoryId}`);
      fetchCategories();
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.error || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBlogForm({
      title: '',
      content: '',
      excerpt: '',
      category_id: '',
      tags: [],
      status: 'draft',
      featured_image: '',
      meta_title: '',
      meta_description: ''
    });
    setTagInput('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage professional blog posts to share medical insights.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
          >
            <Folder size={20} />
            Manage Categories
          </button>
          <button
            onClick={() => {
              setShowBlogForm(true);
              setEditingBlog(null);
              resetForm();
            }}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            New Blog Post
          </button>
        </div>
      </div>

      {/* Blog Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.publishedPosts}</p>
            </div>
            <Globe className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-orange-600">{stats.draftPosts}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalViews}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comments</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.totalComments}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>
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

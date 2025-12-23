
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
        featured_image: blogForm.image,
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
        featured_image: blogForm.image,
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2 tracking-tighter">Manage Blogs</h1>
          <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em]">Create, edit, and manage your blog posts to share medical insights</p>
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
          className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] hover:bg-indigo-700 transition-all flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 active:scale-95"
        >
          <Plus size={20} />
          New Blog Post
        </button>
      </div>

      {/* Blog Form Modal */}
      {showBlogForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card/80 backdrop-blur-3xl rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-2xl">
            <div className="p-8 border-b border-border">
              <h2 className="text-2xl font-black text-foreground tracking-tighter">
                {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Blog Title</label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => handleBlogFormChange('title', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium"
                    placeholder="Enter blog title..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Category</label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => handleBlogFormChange('category', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                  >
                    <option value="">Select Category</option>
                    {blogCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Status</label>
                  <select
                    value={blogForm.status}
                    onChange={(e) => handleBlogFormChange('status', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={blogForm.tags}
                    onChange={(e) => handleBlogFormChange('tags', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium"
                    placeholder="health, medicine, tips..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Featured Image URL</label>
                  <input
                    type="text"
                    value={blogForm.image}
                    onChange={(e) => handleBlogFormChange('image', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Excerpt</label>
                  <textarea
                    value={blogForm.excerpt}
                    onChange={(e) => handleBlogFormChange('excerpt', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium h-24 resize-none"
                    placeholder="Brief description of the blog post..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase mb-2 ml-1 tracking-[0.2em]">Content</label>
                  <textarea
                    value={blogForm.content}
                    onChange={(e) => handleBlogFormChange('content', e.target.value)}
                    className="w-full px-5 py-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium h-64 resize-none"
                    placeholder="Write your blog content here..."
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-border flex justify-end gap-4">
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
                className="px-6 py-4 border border-border rounded-2xl text-foreground font-black text-[11px] uppercase tracking-[0.2em] hover:bg-muted transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!blogForm.title || !blogForm.content}
                className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBlog ? 'Update Blog' : 'Create Blog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
          >
            <option value="all">All Categories</option>
            {blogCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-muted-foreground font-black uppercase tracking-wider">
            <Filter size={16} className="mr-2" />
            {filteredBlogs.length} blog(s) found
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] p-6 shadow-2xl hover:shadow-indigo-500/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Blogs</p>
              <p className="text-3xl font-black text-foreground tracking-tighter">{blogs.length}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-2xl">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] p-6 shadow-2xl hover:shadow-green-500/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Published</p>
              <p className="text-3xl font-black text-green-600 tracking-tighter">
                {blogs.filter(blog => blog.status === 'published').length}
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-2xl">
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] p-6 shadow-2xl hover:shadow-orange-500/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Drafts</p>
              <p className="text-3xl font-black text-orange-600 tracking-tighter">
                {blogs.filter(blog => blog.status === 'draft').length}
              </p>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-2xl">
              <Edit3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] p-6 shadow-2xl hover:shadow-purple-500/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Views</p>
              <p className="text-3xl font-black text-purple-600 tracking-tighter">
                {blogs.reduce((total, blog) => total + blog.views, 0)}
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-2xl">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-border">
          <h3 className="text-xl font-black text-foreground tracking-tighter">Blog Posts</h3>
        </div>

        <div className="divide-y divide-border/40">
          {loading ? (
            <div className="p-20 text-center">
              <BookOpen className="mx-auto h-16 w-16 text-indigo-500/30 mb-6 animate-pulse" />
              <h3 className="text-xl font-black text-foreground mb-2">Loading medical insights...</h3>
              <p className="text-muted-foreground text-sm font-medium tracking-wide">Fetching your premium content</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="p-20 text-center">
              <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/20 mb-6" />
              <h3 className="text-xl font-black text-foreground mb-2">No blogs found</h3>
              <p className="text-muted-foreground mb-8 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                  ? 'We couldn\'t find any blogs matching your current filters. Try adjusting your search.'
                  : 'Your dashboard is empty. Start sharing your medical expertise with your patients today.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && (
                <button
                  onClick={() => setShowBlogForm(true)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 active:scale-95"
                >
                  Create Your First Entry
                </button>
              )}
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="p-8 hover:bg-muted/30 transition-all group border-l-4 border-transparent hover:border-indigo-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-black text-foreground tracking-tight truncate group-hover:text-indigo-600 transition-colors">{blog.title}</h3>
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${blog.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                        }`}>
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2 font-medium">{blog.excerpt}</p>

                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        {blog.publishDate}
                      </span>
                      <span className="flex items-center gap-2">
                        <Eye size={14} className="text-indigo-500" />
                        {blog.views} views
                      </span>
                      <span className="flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-500" />
                        {blog.readTime}
                      </span>
                      <span className="bg-muted px-3 py-1 rounded-lg text-foreground/70">{blog.category}</span>
                    </div>

                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {blog.tags.map((tag, index) => (
                          <span key={index} className="bg-indigo-500/5 text-indigo-500/80 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/10">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button
                      onClick={() => handleEditBlog(blog)}
                      className="p-3 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-500/5"
                      title="Edit Post"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      onClick={() => handlePublishBlog(blog.id)}
                      className={`p-3 rounded-2xl transition-all active:scale-95 shadow-lg ${blog.status === 'published'
                        ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white shadow-orange-500/5'
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-emerald-500/5'
                        }`}
                      title={blog.status === 'published' ? 'Move to Draft' : 'Publish Post'}
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-3 bg-red-500/10 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-500/5"
                      title="Delete Post"
                    >
                      <Trash2 size={18} />
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

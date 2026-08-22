
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
          <h1 className="text-xl font-bold text-foreground tracking-tight">Manage blogs</h1>
          <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">
            Create, edit, and manage your blog posts to share medical insights
          </p>
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
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-bold text-xs shadow-sm active:scale-95"
        >
          <Plus size={16} />
          New post
        </button>
      </div>

      {/* Blog Form Modal */}
      {showBlogForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {editingBlog ? 'Edit blog post' : 'Create new blog post'}
              </h2>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 ml-1">Blog title</label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => handleBlogFormChange('title', e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground/60"
                    placeholder="Enter blog title..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 ml-1">Category</label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => handleBlogFormChange('category', e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-foreground cursor-pointer appearance-none"
                  >
                    <option value="">Select category</option>
                    {blogCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 ml-1">Status</label>
                  <select
                    value={blogForm.status}
                    onChange={(e) => handleBlogFormChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-foreground cursor-pointer appearance-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 ml-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={blogForm.tags}
                    onChange={(e) => handleBlogFormChange('tags', e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground/60"
                    placeholder="health, medicine, tips..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 ml-1">Featured image URL</label>
                  <input
                    type="text"
                    value={blogForm.image}
                    onChange={(e) => handleBlogFormChange('image', e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground/60"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 ml-1">Excerpt</label>
                  <textarea
                    value={blogForm.excerpt}
                    onChange={(e) => handleBlogFormChange('excerpt', e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground/60 h-20 resize-none"
                    placeholder="Brief description of the blog post..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 ml-1">Content</label>
                  <textarea
                    value={blogForm.content}
                    onChange={(e) => handleBlogFormChange('content', e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground/60 h-48 resize-none"
                    placeholder="Write your blog content here..."
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-3 bg-card/50">
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
                className="px-5 py-2 border border-border rounded-lg text-foreground font-bold text-xs hover:bg-muted transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!blogForm.title || !blogForm.content}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-sm shadow-indigo-500/10 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBlog ? 'Update post' : 'Create post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
          <div className="relative group">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search all posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="relative group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-foreground appearance-none cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-muted-foreground"></div>
            </div>
          </div>

          <div className="relative group">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-foreground appearance-none cursor-pointer"
            >
              <option value="all">All categories</option>
              {blogCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-muted-foreground"></div>
            </div>
          </div>

          <div className="flex items-center text-xs text-muted-foreground font-bold pl-2">
            <Filter size={14} className="mr-2 opacity-50" />
            {filteredBlogs.length} posts found
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Total posts</p>
              <p className="text-xl font-bold text-foreground">{blogs.length}</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <BookOpen className="h-5 w-5 text-blue-600 group-hover:text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Published</p>
              <p className="text-xl font-bold text-emerald-600">
                {blogs.filter(blog => blog.status === 'published').length}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Eye className="h-5 w-5 text-emerald-600 group-hover:text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Drafts</p>
              <p className="text-xl font-bold text-orange-600">
                {blogs.filter(blog => blog.status === 'draft').length}
              </p>
            </div>
            <div className="p-2.5 bg-orange-500/10 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Edit3 className="h-5 w-5 text-orange-600 group-hover:text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Total views</p>
              <p className="text-xl font-bold text-purple-600">
                {blogs.reduce((total, blog) => total + (blog.views || 0), 0)}
              </p>
            </div>
            <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <BarChart3 className="h-5 w-5 text-purple-600 group-hover:text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Blog List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <h3 className="text-sm font-bold text-foreground">Blog posts</h3>
        </div>

        <div className="divide-y divide-border/40">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold">Loading medical insights...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="p-16 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-base font-bold text-foreground mb-1">No blogs found</h3>
              <p className="text-muted-foreground mb-6 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                  ? "We couldn't find any blogs matching your current filters. Try adjusting your search."
                  : "Your dashboard is empty. Start sharing your medical expertise with your patients today."
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && (
                <button
                  onClick={() => setShowBlogForm(true)}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-all font-bold text-xs shadow-sm active:scale-95"
                >
                  Create your first entry
                </button>
              )}
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="p-5 hover:bg-muted/30 transition-all group border-l-4 border-transparent hover:border-indigo-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[15px] font-bold text-foreground tracking-tight truncate group-hover:text-indigo-600 transition-colors">{blog.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${blog.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                        }`}>
                        {blog.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-[12px] leading-relaxed mb-3 line-clamp-2 font-medium">{blog.excerpt}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-muted-foreground/70">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-indigo-500" />
                        {blog.publishDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye size={12} className="text-indigo-500" />
                        {blog.views || 0} views
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={12} className="text-indigo-500" />
                        {blog.readTime}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded-md text-foreground/70 border border-border/50">{blog.category}</span>
                    </div>

                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {blog.tags.map((tag, index) => (
                          <span key={index} className="bg-indigo-500/5 text-indigo-500/80 px-2 py-0.5 rounded-md text-[9px] font-bold border border-indigo-500/10">
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-6 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleEditBlog(blog)}
                      className="p-2 hover:bg-muted rounded-lg transition-all text-muted-foreground hover:text-indigo-600 active:scale-95 border border-border/40"
                      title="Edit post"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      onClick={() => handlePublishBlog(blog.id)}
                      className={`p-2 rounded-lg transition-all active:scale-95 border border-border/40 ${blog.status === 'published'
                        ? 'hover:bg-orange-500/10 text-muted-foreground hover:text-orange-600'
                        : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600'
                        }`}
                      title={blog.status === 'published' ? 'Move to draft' : 'Publish post'}
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-muted-foreground hover:text-red-700 active:scale-95 border border-border/40"
                      title="Delete post"
                    >
                      <Trash2 size={15} />
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

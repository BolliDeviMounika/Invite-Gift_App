import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { BookOpen, FileText, User, Calendar, PlusCircle, X, Search, Sparkles } from 'lucide-react';

interface BlogPageProps {
  token: string | null;
}

export default function BlogPage({ token }: BlogPageProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<'Planning' | 'Gifting' | 'Ideas' | 'Wedding' | 'Birthday' | 'Tips'>('Planning');
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [author, setAuthor] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch blogs", err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title || !content) {
      setError("Title and content are required.");
      return;
    }

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          author: author || undefined,
          category,
          imageUrl: imageUrl || undefined
        })
      });

      if (res.ok) {
        setSuccess("Blog post published successfully!");
        setTitle("");
        setContent("");
        setImageUrl("");
        setAuthor("");
        setIsCreating(false);
        fetchBlogs();
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to publish article.");
      }
    } catch (err) {
      setError("Error transmitting to server.");
    }
  };

  const categories = ["All", "Planning", "Gifting", "Ideas", "Wedding", "Birthday", "Tips"];

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          blog.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-gray-50/50 min-h-screen py-16 animate-fade-in font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              Giftify Magazine
            </span>
            <h1 className="mt-4 font-sans font-extrabold text-3xl sm:text-4xl text-gray-900 tracking-tight leading-none">
              Inspiration & <span className="text-purple-600">Celebration Guides</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-lg leading-relaxed">
              Explore event planning directives, curation blueprints, and gifting insights crafted by our celebration experts.
            </p>
          </div>

          {/* Create Post Button (Shown to authenticated organizers) */}
          {token && !isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm rounded-xl cursor-pointer hover:shadow-md transition-all shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Blog Post</span>
            </button>
          )}
        </div>

        {/* Administration Blog Creation Form Overlay */}
        {isCreating && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-purple-200 shadow-md mb-12 relative">
            <button 
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Publish New Article</h2>
            </div>

            {error && <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
            {success && <div className="mb-4 text-xs font-semibold text-green-600 bg-green-50 p-3 rounded-lg">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 5 Rules for Choosing the Perfect Baby Shower Preset"
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Gifting">Gifting</option>
                    <option value="Ideas">Ideas</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Tips">Tips</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Author Name</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your Name (Leave empty for 'Giftify Editor')"
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g., https://unsplash.com/photos/your-image-url"
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Article Content *</label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Draft your brilliant expert guidance regarding event management, budgeting, or celebration registry design..."
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm cursor-pointer shadow-sm"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter and Search Bar Row */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 shadow-sm">
          {/* Categories Horizontal Scroller */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Blogs list in elegant grid format */}
        {filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredBlogs.map((blog) => (
              <article key={blog.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 flex flex-col group">
                <div className="h-56 relative overflow-hidden bg-gray-100">
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 text-xs font-extrabold uppercase bg-amber-500 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-400 shadow-sm">
                    {blog.category}
                  </span>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mb-3 font-medium">
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-purple-400" />
                        <span>{blog.author}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-purple-400" />
                        <span>{blog.date}</span>
                      </span>
                    </div>

                    <h3 className="font-sans font-extrabold text-xl text-gray-900 group-hover:text-purple-600 transition-colors tracking-tight mb-3">
                      {blog.title}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6 font-sans">
                      {blog.content}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-purple-600 font-bold">
                    <span>Reading duration: 3 mins</span>
                    <button className="text-purple-600 group-hover:underline">Read whole entry →</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-3xl py-16 border border-gray-100 shadow-sm max-w-sm mx-auto">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 font-bold mb-1">No articles found</p>
            <p className="text-gray-400 text-xs px-4">Try refining your search text or switching to another category tab.</p>
          </div>
        )}

      </div>
    </div>
  );
}

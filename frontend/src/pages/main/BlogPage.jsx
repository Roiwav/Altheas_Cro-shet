import { useState } from 'react';
import { ArrowRight, Calendar, Clock, Tag, Youtube } from 'lucide-react';

const BlogPage = () => {
  const [posts] = useState([
    {
      id: 1,
      title: 'Simple Crochet Flower – Pattern and Tutorial',
      excerpt: 'Discover how to create beautiful crochet flower patterns',
      date: '2016-04-26',
      readTime: '10 min read',
      category: 'Tutorials',
      type: 'article',
      content: {
        image: '/Screenshot 2025-09-10 215331.png'
      },
      url: 'https://helloyellowyarn.com/2016/04/28/simple-crochet-flower-pattern-and-tutorial/'
    },
    {
      id: 2,
      title:'How to Crochet a Simple Flower | Easy Crochet Flower Tutorial for Absolute BEGINNERS',
      excerpt: 'Watch this tutorial to learn how to crochet simple flower',
      date: '2022-03-04',
      readTime: '16 min to watch',
      category: 'Video Tutorial',
      type: 'video',
      content: {
       image: '/Screenshot 2025-09-11 014741.png'
      },
      url: 'https://youtu.be/iWuOdb37v_8?feature=shared'
    },
    {
      id: 3,
      title: 'Types of Yarn: Everything You Need to Know',
      excerpt: 'Learn about different yarn types, from yarn weight to fiber content and from eye-catching colors to delightful textures.',
      date: '2023-03-03',
      readTime: '10 min read',
      category: 'Materials',
      type: 'article',
      content: {
        image: '/raelle-gann-owens-yarn-819x1024.jpg'
      },
      url:'https://sarahmaker.com/types-of-yarn/'
    },
    
  ]);

  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pt-24 lg:pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Crochet Blog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Tips, tutorials, and inspiration for crochet lovers</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              {post.type === 'video' ? (
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="block relative pt-[56.25%] overflow-hidden">
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Youtube className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                  {getYouTubeVideoId(post.url) && (
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeVideoId(post.url)}/maxresdefault.jpg`}
                      alt={post.title}
                      className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        // Fallback to a placeholder if YouTube thumbnail fails
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="h-48 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <img
                    src={post.content.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // Show placeholder if image fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><span>Image not available</span></div>';
                    }}
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span className="flex items-center mr-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    {post.date}
                  </span>
                  <span className="flex items-center">
                    {post.type === 'video' ? (
                      <Youtube className="w-4 h-4 mr-1" />
                    ) : (
                      <Clock className="w-4 h-4 mr-1" />
                    )}
                    {post.readTime}
                  </span>
                </div>
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 rounded-full mb-3">
                  <Tag className="w-3 h-3 mr-1" />
                  {post.category}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {post.excerpt}
                </p>
                {post.type === 'video' ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-pink-600 dark:text-pink-400 font-medium hover:text-pink-700 dark:hover:text-pink-300"
                  >
                    Watch now
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                ) : (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-pink-600 dark:text-pink-400 font-medium hover:text-pink-700 dark:hover:text-pink-300"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
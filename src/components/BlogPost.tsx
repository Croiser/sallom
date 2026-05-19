import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Share2, 
  Clock, 
  ChevronRight,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { blogPosts, BlogPost as BlogPostType } from '../data/blogPosts';
import SEO from './SEO';

interface BlogPostProps {
  slug: string;
  onNavigate: (tab: string, data?: any) => void;
}

export default function BlogPost({ slug, onNavigate }: BlogPostProps) {
  const post = blogPosts.find(p => p.slug === slug);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const relatedPosts = blogPosts
    .filter(p => p.slug !== slug && p.category === post?.category)
    .slice(0, 2);

  const [isCopied, setIsCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Artigo não encontrado</h2>
        <p className="text-zinc-500 mb-8">O artigo que você está procurando não existe ou foi removido.</p>
        <button 
          onClick={() => onNavigate('blog')}
          className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold"
        >
          Voltar ao Blog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={post.title} 
        description={post.metaDescription} 
        keywords={post.keywords}
        image={post.image}
        type="article"
        author={post.author}
      />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-20 left-0 right-0 h-1 bg-rose-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Header */}
      <header className="pt-32 pb-16 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4">
          <button 
            onClick={() => onNavigate('blog')}
            className="flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors mb-12 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Todos os artigos
          </button>
          
          <div className="space-y-6">
            <span className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold uppercase tracking-wider">
              {post.category}
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 leading-tight tracking-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center overflow-hidden">
                  <User size={20} className="text-zinc-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-900">{post.author}</span>
                  <span>Especialista em Gestão</span>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-rose-500" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-rose-500" />
                5 min de leitura
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <main className="flex-1 max-w-4xl">
            <div className="aspect-[21/9] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <article className="prose prose-zinc prose-lg max-w-none">
              <div 
                className="blog-content space-y-6 text-zinc-600 leading-relaxed text-lg"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>
            
            {/* Share Buttons */}
            <div className="mt-16 pt-8 border-t border-zinc-100">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Compartilhar:</span>
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-rose-500 hover:text-white transition-all">
                      <Facebook size={18} />
                    </button>
                    <button className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-rose-500 hover:text-white transition-all">
                      <Twitter size={18} />
                    </button>
                    <button className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-rose-500 hover:text-white transition-all">
                      <Linkedin size={18} />
                    </button>
                    <button className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-rose-500 hover:text-white transition-all">
                      <MessageCircle size={18} />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleShare}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    isCopied ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  <Share2 size={18} />
                  {isCopied ? 'Copiado!' : 'Copiar Link'}
                </button>
              </div>
            </div>
            
            {/* CTA Box */}
            <div className="mt-16 p-10 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-[3rem] text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Gostou desse conteúdo?</h3>
                <p className="text-zinc-400 mb-8 max-w-lg">
                  O SallonProManager ajuda você a aplicar essas dicas na prática, com ferramentas de gestão que economizam seu tempo.
                </p>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
                >
                  Começar agora grátis
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full" />
            </div>
          </main>
          
          {/* Sidebar */}
          <aside className="w-full lg:w-80 space-y-12">
            <div>
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Artigos Relacionados</h4>
              <div className="space-y-8">
                {relatedPosts.map(rp => (
                  <div 
                    key={rp.id}
                    className="group cursor-pointer"
                    onClick={() => onNavigate('blog-post', { slug: rp.slug })}
                  >
                    <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                      <img src={rp.image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <h5 className="font-bold text-zinc-900 line-clamp-2 group-hover:text-rose-500 transition-colors">
                      {rp.title}
                    </h5>
                    <span className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1">
                      Ler agora
                      <ChevronRight size={14} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="sticky top-32 bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
              <h4 className="font-bold text-zinc-900 mb-4">Newsletter</h4>
              <p className="text-sm text-zinc-500 mb-6">Receba novos artigos e dicas de gestão semanalmente.</p>
              <form className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Seu e-mail"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-rose-500 outline-none transition-all"
                />
                <button className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all">
                  Inscrever-se
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

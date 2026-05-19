import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  ChevronRight, 
  Calendar, 
  User, 
  ArrowLeft,
  Clock,
  Filter
} from 'lucide-react';
import { blogPosts } from '../data/blogPosts';
import SEO from './SEO';

interface BlogProps {
  onNavigate: (tab: string, data?: any) => void;
}

export default function Blog({ onNavigate }: BlogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(blogPosts.map(post => post.category)));

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white pb-20">
      <SEO 
        title="Blog - Dicas e Estratégias para o seu Salão" 
        description="Aprenda a gerenciar seu salão de beleza, barbearia ou estética com as melhores dicas de gestão, marketing e tecnologia."
      />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-zinc-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Início
          </button>
          
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">
              Conhecimento que transforma o seu <span className="text-rose-500">Negócio</span>.
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed">
              Dicas práticas de gestão, marketing e tecnologia para você profissionalizar seu salão e faturar mais.
            </p>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full" />
      </section>

      {/* Search and Filters */}
      <section className="py-12 bg-white sticky top-20 z-40 border-b border-zinc-100 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-100 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  !selectedCategory 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Todos
              </button>
              {categories.map(category => (
                <button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    selectedCategory === category 
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden hover:shadow-2xl hover:shadow-zinc-200 transition-all cursor-pointer flex flex-col"
                  onClick={() => onNavigate(`blog-post`, { slug: post.slug })}
                >
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-xs font-bold text-zinc-900 shadow-sm">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        5 min de leitura
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-zinc-900 mb-4 group-hover:text-rose-500 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-zinc-500 text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-zinc-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                          <User size={14} className="text-zinc-500" />
                        </div>
                        <span className="text-xs font-bold text-zinc-600">{post.author}</span>
                      </div>
                      <span className="text-rose-500 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Ler mais
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-zinc-300" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900">Nenhum artigo encontrado</h3>
              <p className="text-zinc-500 mt-2">Tente ajustar sua busca ou filtro.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
                className="mt-6 text-rose-500 font-bold hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-rose-500 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-rose-500/20">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Mantenha-se à frente do mercado</h2>
              <p className="text-rose-100 mb-8">
                Receba dicas exclusivas de gestão e marketing para o seu salão diretamente no seu e-mail.
              </p>
              <form className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Seu melhor e-mail"
                  className="flex-1 bg-white/20 border border-white/30 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:text-zinc-900 placeholder:text-rose-100 transition-all"
                  required
                />
                <button 
                  type="submit"
                  className="bg-zinc-950 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl"
                >
                  Inscrever-se
                </button>
              </form>
              <p className="text-xs text-rose-200 mt-4 italic">Prometemos não enviar spam. Cancele quando quiser.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

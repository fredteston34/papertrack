import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll } from '../types';
import { analyzeStock } from '../services/geminiService';
import { Bot, Send, Sparkles, User } from 'lucide-react';

interface AssistantProps {
  inventory: PaperRoll[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Assistant: React.FC<AssistantProps> = ({ inventory }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant de stock. Vous pouvez me poser des questions comme "Combien de bobines en stock pour la commande X ?" ou "Fais un résumé des entrées du jour".' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    const response = await analyzeStock(userMessage, inventory);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
        <div className="mb-4">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Sparkles className="text-purple-600" />
                Assistant IA
            </h2>
            <p className="text-slate-500">Analysez votre stock en langage naturel grâce à Gemini.</p>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                                <Bot size={18} />
                            </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                        }`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                                <User size={18} />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                     <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            <Bot size={18} />
                        </div>
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Posez une question sur votre stock..."
                        className="w-full pl-6 pr-14 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={!query.trim() || loading}
                        className="absolute right-2 top-2 bottom-2 aspect-square bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 disabled:bg-slate-300 transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="mt-2 flex justify-center gap-2">
                    {['Combien de bobines en stock ?', 'Total des entrées aujourd\'hui', 'Liste des commandes'].map(hint => (
                        <button
                            key={hint}
                            type="button"
                            onClick={() => setQuery(hint)}
                            className="text-xs px-3 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                        >
                            {hint}
                        </button>
                    ))}
                </div>
            </form>
        </div>
    </div>
  );
};

export default Assistant;
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Msg { role: 'user' | 'assistant'; content: string; }

interface Props {
  slug: string;
  ownerName: string;
}

export default function VCardChatWidget({ slug, ownerName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: `হ্যালো! আমি ${ownerName}-এর AI সহকারী। আপনি কিভাবে সাহায্য চান?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/vcard-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ slug, messages: next }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'AI অনুরোধ ব্যর্থ হয়েছে।' }));
        toast({ title: 'ত্রুটি', description: errBody.error, variant: 'destructive' });
        setMessages((m) => [...m, { role: 'assistant', content: 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।' }]);
        return;
      }

      // Stream SSE OpenAI-compatible
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let assistant = '';
      setMessages((m) => [...m, { role: 'assistant', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: 'assistant', content: assistant };
                return copy;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      toast({ title: 'নেটওয়ার্ক ত্রুটি', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl flex items-center justify-center"
        aria-label="AI চ্যাট"
      >
        <MessageCircle size={26} />
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold rounded-full px-1.5 py-0.5">AI</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <div>
                  <div className="font-semibold leading-tight">AI সহকারী</div>
                  <div className="text-xs opacity-90">{ownerName}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="বন্ধ করুন">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border rounded-bl-sm'
                    }`}
                  >
                    {m.content || (loading && i === messages.length - 1 ? '...' : '')}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-sm px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="p-3 border-t bg-white flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="আপনার প্রশ্ন লিখুন..."
                disabled={loading}
                autoFocus
              />
              <Button type="submit" disabled={loading || !input.trim()} size="icon" className="bg-purple-600 hover:bg-purple-700">
                <Send size={16} />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

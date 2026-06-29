import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Search, Loader2, Mail, Phone, MessageSquare, Calendar, Trash2, Download, Tag, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTeamRoles } from '@/hooks/useTeamRoles';

interface Lead {
  id: string;
  vcard_id: string;
  user_id: string | null;
  team_id: string | null;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string | null;
  source: string;
  status: string;
  message: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
}

const TAG_PRESETS = ['hot', 'follow-up', 'vip', 'cold', 'spam'];
const TAG_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700',
  'follow-up': 'bg-amber-100 text-amber-700',
  vip: 'bg-purple-100 text-purple-700',
  cold: 'bg-sky-100 text-sky-700',
  spam: 'bg-gray-200 text-gray-700',
};

const STATUSES = [
  { value: 'new', label: 'নতুন', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'যোগাযোগ করা হয়েছে', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified', label: 'যোগ্য', color: 'bg-purple-100 text-purple-700' },
  { value: 'converted', label: 'রূপান্তরিত', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'হারানো', color: 'bg-gray-100 text-gray-700' },
];

const SOURCES: Record<string, string> = {
  contact_form: 'কনট্যাক্ট ফর্ম',
  chat: 'চ্যাট',
  appointment: 'অ্যাপয়েন্টমেন্ট',
  manual: 'ম্যানুয়াল',
  other: 'অন্যান্য',
};

export default function Leads() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { canEdit, canDelete, getRole } = useTeamRoles();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState<{ id: string; notes: string } | null>(null);
  const [editingTags, setEditingTags] = useState<{ id: string; tags: string[]; input: string } | null>(null);

  const toggleTag = async (id: string, current: string[], tag: string) => {
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    const { error } = await supabase.from('vcard_leads').update({ tags: next }).eq('id', id);
    if (error) { toast({ title: 'Tag আপডেট ব্যর্থ', variant: 'destructive' }); return; }
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, tags: next } : l)));
    if (editingTags?.id === id) setEditingTags({ ...editingTags, tags: next });
  };

  const addCustomTag = async () => {
    if (!editingTags) return;
    const raw = editingTags.input.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 20);
    if (!raw || editingTags.tags.includes(raw)) { setEditingTags({ ...editingTags, input: '' }); return; }
    await toggleTag(editingTags.id, editingTags.tags, raw);
    setEditingTags({ ...editingTags, input: '' });
  };

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vcard_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'লোড ব্যর্থ', description: error.message, variant: 'destructive' });
    } else {
      setLeads(data as Lead[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('vcard_leads').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'আপডেট ব্যর্থ', variant: 'destructive' });
      return;
    }
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const saveNotes = async () => {
    if (!editingNotes) return;
    const { error } = await supabase
      .from('vcard_leads')
      .update({ notes: editingNotes.notes })
      .eq('id', editingNotes.id);
    if (error) {
      toast({ title: 'সংরক্ষণ ব্যর্থ', variant: 'destructive' });
      return;
    }
    setLeads((ls) => ls.map((l) => (l.id === editingNotes.id ? { ...l, notes: editingNotes.notes } : l)));
    setEditingNotes(null);
    toast({ title: 'নোট সংরক্ষিত' });
  };

  const removeLead = async (id: string) => {
    if (!confirm('এই lead মুছবেন?')) return;
    const { error } = await supabase.from('vcard_leads').delete().eq('id', id);
    if (error) {
      toast({ title: 'মুছতে ব্যর্থ', variant: 'destructive' });
      return;
    }
    setLeads((ls) => ls.filter((l) => l.id !== id));
  };

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Tags', 'Message', 'Notes', 'Created'];
    const rows = filtered.map((l) => [
      l.visitor_name, l.visitor_email || '', l.visitor_phone || '',
      l.source, l.status, (l.tags || []).join('|'),
      (l.message || '').replace(/\n/g, ' '),
      (l.notes || '').replace(/\n/g, ' '),
      new Date(l.created_at).toISOString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter((l) => {
    const matchesSearch = !search || [l.visitor_name, l.visitor_email, l.visitor_phone, l.message]
      .filter(Boolean).some((v) => v!.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesTag = tagFilter === 'all' || (l.tags || []).includes(tagFilter);
    return matchesSearch && matchesStatus && matchesTag;
  });

  const allTags = Array.from(new Set(leads.flatMap((l) => l.tags || []))).sort();

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s.value] = leads.filter((l) => l.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">লগইন করুন</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> ড্যাশবোর্ড
          </Link>
          <div className="flex items-center gap-2">
            <Users size={20} />
            <h1 className="text-lg font-semibold">Leads / CRM</h1>
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download size={14} className="mr-1" /> CSV
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value === statusFilter ? 'all' : s.value)}
              className={`rounded-xl border p-3 text-left transition ${statusFilter === s.value ? 'border-primary ring-2 ring-primary/20' : ''}`}
            >
              <div className="text-2xl font-bold">{statusCounts[s.value] || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ইমেইল, ফোন খুঁজুন..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব status</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Tag" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব tag</SelectItem>
              {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p>কোনো lead পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l) => {
              const status = STATUSES.find((s) => s.value === l.status) || STATUSES[0];
              const writable = canEdit(l.team_id, l.user_id);
              const deletable = canDelete(l.team_id, l.user_id);
              const role = getRole(l.team_id);
              return (
                <div key={l.id} className="border rounded-xl p-4 bg-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{l.visitor_name}</h3>
                        <Badge variant="outline" className="text-xs">{SOURCES[l.source] || l.source}</Badge>
                        <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                        {role && role !== 'owner' && (
                          <Badge variant="outline" className="text-[10px] uppercase">{role}</Badge>
                        )}
                        {(l.tags || []).map((t) => (
                          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full ${TAG_COLORS[t] || 'bg-muted text-foreground'}`}>#{t}</span>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {l.visitor_email && <a href={`mailto:${l.visitor_email}`} className="flex items-center gap-1 hover:text-foreground"><Mail size={12} />{l.visitor_email}</a>}
                        {l.visitor_phone && <a href={`tel:${l.visitor_phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone size={12} />{l.visitor_phone}</a>}
                        <span className="flex items-center gap-1"><Calendar size={12} />{new Date(l.created_at).toLocaleDateString('bn-BD')}</span>
                      </div>
                      {l.message && (
                        <p className="mt-2 text-sm bg-muted/50 p-2 rounded">{l.message}</p>
                      )}
                      {l.notes && (
                        <p className="mt-2 text-xs italic text-muted-foreground">📝 {l.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)} disabled={!writable}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Dialog open={editingTags?.id === l.id} onOpenChange={(o) => !o && setEditingTags(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={!writable} onClick={() => setEditingTags({ id: l.id, tags: l.tags || [], input: '' })}>
                            <Tag size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Tags - {l.visitor_name}</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {(editingTags?.tags || []).map((t) => (
                                <span key={t} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${TAG_COLORS[t] || 'bg-muted'}`}>
                                  #{t}
                                  <button onClick={() => toggleTag(l.id, editingTags!.tags, t)}><X size={12} /></button>
                                </span>
                              ))}
                              {(editingTags?.tags || []).length === 0 && <span className="text-xs text-muted-foreground">কোনো tag নেই</span>}
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">দ্রুত যোগ করুন:</div>
                              <div className="flex flex-wrap gap-2">
                                {TAG_PRESETS.filter((t) => !(editingTags?.tags || []).includes(t)).map((t) => (
                                  <button key={t} onClick={() => toggleTag(l.id, editingTags!.tags, t)} className={`text-xs px-2 py-1 rounded-full border hover:bg-muted ${TAG_COLORS[t] || ''}`}>
                                    + #{t}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={editingTags?.input || ''}
                                onChange={(e) => editingTags && setEditingTags({ ...editingTags, input: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                                placeholder="কাস্টম tag..."
                                className="h-9 text-sm"
                              />
                              <Button size="sm" onClick={addCustomTag}><Plus size={14} /></Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={editingNotes?.id === l.id} onOpenChange={(o) => !o && setEditingNotes(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={!writable} onClick={() => setEditingNotes({ id: l.id, notes: l.notes || '' })}>
                            <MessageSquare size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>নোট - {l.visitor_name}</DialogTitle></DialogHeader>
                          <Textarea
                            value={editingNotes?.notes || ''}
                            onChange={(e) => setEditingNotes({ id: l.id, notes: e.target.value })}
                            rows={6}
                            placeholder="ফলো-আপ নোট লিখুন..."
                          />
                          <Button onClick={saveNotes}>সংরক্ষণ করুন</Button>
                        </DialogContent>
                      </Dialog>
                      {deletable && (
                        <Button size="sm" variant="ghost" onClick={() => removeLead(l.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

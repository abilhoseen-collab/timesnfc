import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <WifiOff size={40} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">আপনি অফলাইনে</h1>
        <p className="text-muted-foreground mb-6">
          ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। ক্যাশ-করা পেজগুলো এখনো দেখতে পারবেন।
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw size={16} className="mr-2" /> আবার চেষ্টা করুন
          </Button>
          <Button variant="outline" asChild>
            <Link to="/"><Home size={16} className="mr-2" /> হোম</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

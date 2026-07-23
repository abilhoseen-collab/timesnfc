import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global React ErrorBoundary — catches render/runtime errors so a single
 * broken component (or a lazy chunk load failure) does not crash the app.
 * Renders a friendly Bengali fallback UI with reload + home actions.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  private handleHome = () => {
    if (typeof window !== 'undefined') window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const isChunkError =
      this.state.error?.name === 'ChunkLoadError' ||
      /Loading chunk|Failed to fetch dynamically imported module/i.test(
        this.state.error?.message || ''
      );

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-destructive" size={32} />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            {isChunkError ? 'নতুন সংস্করণ পাওয়া গেছে' : 'কিছু একটা ভুল হয়েছে'}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isChunkError
              ? 'অ্যাপের একটি অংশ লোড করা যায়নি। পেজ রিলোড করলে সমস্যা সমাধান হবে।'
              : 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন বা হোমে ফিরে যান।'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={this.handleReload} className="gap-2">
              <RefreshCw size={16} />
              পেজ রিলোড করুন
            </Button>
            <Button variant="outline" onClick={this.handleHome} className="gap-2">
              <Home size={16} />
              হোমে যান
            </Button>
            {!isChunkError && (
              <Button variant="ghost" onClick={this.handleReset}>
                আবার চেষ্টা করুন
              </Button>
            )}
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 text-left text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

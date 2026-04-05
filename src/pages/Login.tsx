import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('123456');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotMode) { setResetSent(true); return; }
    setLoading(true); setError('');
    const err = await login(email, password, remember);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-wide">WR-FMS</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Warehouse Robot Fleet Management</p>
        </div>
        <form onSubmit={handleSubmit} className="industrial-card space-y-4">
          <h2 className="text-sm font-semibold text-foreground">{forgotMode ? 'Reset Password' : 'Sign In'}</h2>
          {error && <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">{error}</div>}
          {resetSent && <div className="text-xs text-status-active bg-status-active/10 border border-status-active/20 rounded px-3 py-2">Password reset link sent (mock)</div>}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 bg-background border-border text-sm" />
          </div>
          {!forgotMode && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
              <div className="relative mt-1">
                <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="bg-background border-border text-sm pr-9" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          {!forgotMode && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded border-border" />
              Remember me
            </label>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : forgotMode ? 'Send Reset Link' : 'Sign In'}
          </Button>
          <button type="button" className="text-xs text-primary hover:underline w-full text-center" onClick={() => { setForgotMode(!forgotMode); setResetSent(false); }}>
            {forgotMode ? 'Back to Sign In' : 'Forgot password?'}
          </button>
        </form>
        <div className="mt-6 industrial-card">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Demo Accounts</p>
          {[{ e: 'admin@demo.com', r: 'Admin' }, { e: 'supervisor@demo.com', r: 'Supervisor' }, { e: 'operator@demo.com', r: 'Operator' }].map(a => (
            <button key={a.e} className="w-full text-left text-xs py-1.5 px-2 rounded hover:bg-accent/50 flex justify-between text-muted-foreground" onClick={() => { setEmail(a.e); setPassword('123456'); }}>
              <span>{a.e}</span><span className="text-primary">{a.r}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

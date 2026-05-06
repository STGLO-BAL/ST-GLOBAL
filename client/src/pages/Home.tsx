import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowDown, ArrowUp, BarChart3, Building2, Coins, Moon, ShieldCheck, Sun, 
  TrendingUp, UserRound, Wallet, Eye, EyeOff, Lock, Mail, LogOut, 
  ChevronRight, ExternalLink, Globe, Zap, Activity, CreditCard, History, 
  Shield, Smartphone, Headphones, Info, Search, Megaphone, Share2, Landmark, HelpCircle, ZapIcon
} from "lucide-react";
import { toast } from "sonner";
import { MarketTable } from "@/components/MarketTable";

type SymbolCode = "BTCUSDT" | "ETHUSDT" | "BNBUSDT" | "SOLUSDT" | "XRPUSDT" | "ADAUSDT" | "DOGEUSDT" | "DOTUSDT" | "MATICUSDT" | "LINKUSDT" | "UNIUSDT" | "LTCUSDT" | "BCHUSDT" | "TRXUSDT" | "AVAXUSDT" | "XAUUSD" | "XAGUSD" | "EURUSD" | "GBPUSD";

const nav = [
  ["/", "Home"],
  ["/spot", "Spot"],
  ["/contracts", "Contracts"],
  ["/assets", "Assets"],
  ["/profile", "Profile"],
  ["/about", "About"],
] as const;

function useTokenState() {
  const [token, setToken] = useState(() => (typeof window === "undefined" ? "" : localStorage.getItem("stglobal_token") ?? ""));
  const saveToken = (nextToken: string) => {
    setToken(nextToken);
    localStorage.setItem("stglobal_token", nextToken);
  };
  const clearToken = () => {
    setToken("");
    localStorage.removeItem("stglobal_token");
  };
  return { token, saveToken, clearToken };
}

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const me = trpc.auth.me.useQuery();
  const { clearToken } = useTokenState();
  const utils = trpc.useUtils();
  
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearToken();
      utils.auth.me.invalidate();
      toast.success("Logged out safely");
    },
  });

  return (
    <div className="min-h-screen bg-[#0b0e11] text-slate-200 font-sans selection:bg-[#f0b90b]/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b0e11]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="grid size-10 place-items-center rounded-lg bg-[#f0b90b] text-black shadow-[0_0_15px_rgba(240,185,11,0.3)] transition-transform group-hover:scale-105">
              <ZapIcon className="size-6 fill-current" />
            </div>
            <div>
              <div className="font-black text-xl tracking-tighter text-white">STGLOBAL</div>
              <div className="text-[10px] font-bold text-[#f0b90b] uppercase tracking-widest">Pro Exchange</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden gap-2 lg:flex">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className={`rounded-md px-4 py-2 text-sm font-bold transition-all ${location === href ? "text-[#f0b90b]" : "text-slate-400 hover:text-white"}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {me.data ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">{me.data.email}</div>
                  <div className="text-[10px] font-black text-[#f0b90b] uppercase tracking-widest">{me.data.vipLevel}</div>
                </div>
                <Button onClick={() => logout.mutate()} variant="outline" size="sm" className="border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-bold">
                  <LogOut className="size-4 mr-2" /> Logout
                </Button>
              </div>
            ) : (
              <Link href="/">
                <Button size="sm" className="bg-[#f0b90b] text-black hover:bg-[#ffd33d] font-bold">Login</Button>
              </Link>
            )}
            <button onClick={toggleTheme} className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:pb-10">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#1e2329]/95 backdrop-blur-xl lg:hidden">
        <div className="flex justify-around items-center">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-3 px-2 transition ${location === href ? "text-[#f0b90b]" : "text-slate-500"}`}>
              {label === "Home" && <BarChart3 className="size-5" />}
              {label === "Spot" && <Coins className="size-5" />}
              {label === "Contracts" && <Activity className="size-5" />}
              {label === "Assets" && <Wallet className="size-5" />}
              {label === "Profile" && <UserRound className="size-5" />}
              {label === "About" && <Building2 className="size-5" />}
              <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function HomePage() {
  const me = trpc.auth.me.useQuery();
  const balances = trpc.wallet.balances.useQuery(undefined, { enabled: !!me.data });
  const [showBalance, setShowBalance] = useState(true);

  const usdtWallet = balances.data?.find(w => w.asset === "USDT");
  const balance = usdtWallet ? Number(usdtWallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

  if (!me.data) {
    return <AuthPanel />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SECTION A - ACCOUNT OVERVIEW CARD */}
      <Card className="border-slate-800 bg-[#1e2329] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <ZapIcon className="size-32 text-[#f0b90b]" />
        </div>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400">{me.data.email}</span>
                <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                  <ShieldCheck className="size-3" /> Verified
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Available Balance</span>
                  <button onClick={() => setShowBalance(!showBalance)} className="hover:text-white transition">
                    {showBalance ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                </div>
                <div className="text-5xl font-black text-[#f0b90b] tracking-tighter">
                  {showBalance ? `${balance} USDT` : "******"}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Revenue</div>
                <div className="text-xl font-black text-white">$0.00</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Financial Funds</div>
                <div className="text-xl font-black text-white">$0.00</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-slate-800">
            <Button className="bg-[#f0b90b] text-black hover:bg-[#ffd33d] font-black px-8 gap-2">
              <CreditCard className="size-4" /> Deposit
            </Button>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white font-black px-8 gap-2">
              <Wallet className="size-4" /> Withdraw
            </Button>
            <Link href="/contracts">
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-white font-black px-8 gap-2">
                <Activity className="size-4" /> Trade
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* SECTION B - PROMOTIONAL BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "VIP Rewards", desc: "Unlock exclusive trading benefits", color: "from-blue-600 to-blue-900" },
          { title: "Referral Program", desc: "Earn 20% commission on friends", color: "from-[#f0b90b] to-[#d4a500]" },
          { title: "New Listing", desc: "Trade the latest tokens now", color: "from-purple-600 to-purple-900" }
        ].map((banner, i) => (
          <div key={i} className={`p-6 rounded-2xl bg-gradient-to-br ${banner.color} shadow-lg relative overflow-hidden group cursor-pointer`}>
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="size-24 text-white" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{banner.title}</h3>
            <p className="text-white/80 text-sm font-bold mt-1">{banner.desc}</p>
          </div>
        ))}
      </div>

      {/* SECTION C - ANNOUNCEMENT BAR */}
      <Card className="border-slate-800 bg-[#1e2329] shadow-lg border-l-4 border-l-[#f0b90b]">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#f0b90b]/10 p-2 rounded-lg text-[#f0b90b]">
              <Megaphone className="size-5" />
            </div>
            <div className="text-sm font-bold text-white">App Upgrade and Optimization Announcement</div>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white">Dismiss</Button>
        </CardContent>
      </Card>

      {/* SECTION D - SERVICES GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Invite", icon: Share2, color: "bg-blue-500/10 text-blue-500" },
          { label: "Loan", icon: Landmark, color: "bg-purple-500/10 text-purple-500" },
          { label: "Tuto-Center", icon: HelpCircle, color: "bg-green-500/10 text-green-500" },
          { label: "Quick Recharge", icon: Zap, color: "bg-orange-500/10 text-orange-500" }
        ].map((service, i) => (
          <Card key={i} className="border-slate-800 bg-[#1e2329] hover:bg-slate-800 transition-colors cursor-pointer group">
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <div className={`p-4 rounded-2xl ${service.color} group-hover:scale-110 transition-transform`}>
                <service.icon className="size-6" />
              </div>
              <span className="text-sm font-black text-white uppercase tracking-widest">{service.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECTION E - MARKET TRENDS TABLE */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-6 text-[#f0b90b]" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Market Trends</h2>
        </div>
        <MarketTable />
      </div>
    </div>
  );
}

function AuthPanel() {
  const utils = trpc.useUtils();
  const { saveToken } = useTokenState();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@stglobal.app");
  const [password, setPassword] = useState("Password123");
  const [showPassword, setShowPassword] = useState(false);

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      saveToken(data.token);
      utils.auth.me.invalidate();
      toast.success("Welcome back to STGLOBAL");
    },
    onError: (err) => toast.error(err.message),
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      saveToken(data.token);
      utils.auth.me.invalidate();
      toast.success("Account created successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="grid place-items-center min-h-[70vh]">
      <Card className="border-slate-800 bg-[#1e2329] shadow-2xl w-full max-w-md">
        <CardHeader className="text-center">
          <div className="size-16 rounded-2xl bg-[#f0b90b] text-black flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(240,185,11,0.2)]">
            <ZapIcon className="size-10 fill-current" />
          </div>
          <CardTitle className="text-2xl font-black text-white">{mode === "login" ? "Sign In" : "Join STGLOBAL"}</CardTitle>
          <p className="text-xs text-slate-400">Access professional crypto trading dashboard</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-slate-700 bg-[#0b0e11] text-white focus:border-[#f0b90b]"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-slate-700 bg-[#0b0e11] text-white focus:border-[#f0b90b]"
                  placeholder="••••••••"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => mode === "login" ? login.mutate({ email, password }) : register.mutate({ email, password })}
            disabled={login.isPending || register.isPending}
            className="w-full h-12 bg-[#f0b90b] text-black hover:bg-[#ffd33d] font-black text-lg"
          >
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </Button>

          <div className="text-center">
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-xs font-bold text-[#f0b90b] hover:underline uppercase tracking-widest">
              {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContractsPage() {
  const me = trpc.auth.me.useQuery();
  const [symbol, setSymbol] = useState<SymbolCode>("BTCUSDT");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [amount, setAmount] = useState("1000");

  const rules = trpc.trading.rules.useQuery();
  const price = trpc.market.price.useQuery({ symbol }, { refetchInterval: 3000 });
  const placeContract = trpc.trading.placeContract.useMutation({
    onSuccess: () => {
      toast.success("Contract placed successfully!");
      setAmount("1000");
    },
    onError: (err) => toast.error(err.message),
  });

  const currentRule = rules.data?.find((r) => r.durationSeconds === selectedDuration);
  const profitRate = currentRule ? Number(currentRule.profitRate) : 0.1;
  const estimatedRevenue = Number(amount) * (1 + profitRate);
  
  const amountNum = parseFloat(amount) || 0;
  const minAmount = currentRule?.minAmount ? parseInt(currentRule.minAmount.toString()) : 0;
  const isValid = currentRule && amountNum >= minAmount;

  if (!me.data) return <AuthPanel />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trading Panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-slate-800 bg-[#1e2329] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Short-Term Contracts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trading Pair</Label>
              <Select value={symbol} onValueChange={(v) => setSymbol(v as SymbolCode)}>
                <SelectTrigger className="border-slate-700 bg-[#0b0e11] text-white font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-[#1e2329] text-white">
                  {["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "DOTUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT", "LTCUSDT", "BCHUSDT", "TRXUSDT", "AVAXUSDT", "XAUUSD", "XAGUSD", "EURUSD", "GBPUSD"].map((s) => (
                    <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-between items-end p-3 rounded-lg bg-[#0b0e11] border border-slate-800">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Price</div>
                  <div className="text-2xl font-black text-white">${Number(price.data?.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                </div>
                <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Real-time</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {rules.data?.map((rule) => (
                  <button
                    key={rule.durationSeconds}
                    onClick={() => setSelectedDuration(rule.durationSeconds)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedDuration === rule.durationSeconds
                        ? "border-[#f0b90b] bg-[#f0b90b]/10 text-[#f0b90b]"
                        : "border-slate-800 bg-[#0b0e11] text-slate-500 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-sm font-black">{rule.durationSeconds}s</div>
                    <div className="text-[10px] font-black text-green-500">+{(Number(rule.profitRate) * 100).toFixed(0)}%</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount (USDT)</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min. ${currentRule?.minAmount || 100}`}
                  className={`h-12 border-2 bg-[#0b0e11] text-white font-black text-lg ${
                    !isValid && amount ? "border-red-500" : "border-slate-700 focus:border-[#f0b90b]"
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">USDT</div>
              </div>
              <div className="flex justify-between items-center px-1">
                <div className="text-[10px] font-black text-slate-500 uppercase">Estimated Revenue:</div>
                <div className="text-xs font-black text-green-500">{estimatedRevenue.toFixed(2)} USDT</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 30000, 50000, 100000, 300000, 500000, 1000000].map((q) => (
                <Button
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  variant="outline"
                  className="h-8 border-slate-800 bg-[#0b0e11] text-slate-400 hover:text-white hover:bg-slate-800 text-[9px] font-black p-0"
                >
                  {q >= 1000000 ? `${q/1000000}M` : q >= 1000 ? `${q/1000}K` : q}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => placeContract.mutate({ symbol, direction: "UP", durationSeconds: selectedDuration as any, amount })}
                disabled={!isValid || placeContract.isPending}
                className="h-14 bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-[0_4px_15px_rgba(22,163,74,0.3)] gap-2"
              >
                <ArrowUp className="size-6" /> UP
              </Button>
              <Button
                onClick={() => placeContract.mutate({ symbol, direction: "FALL", durationSeconds: selectedDuration as any, amount })}
                disabled={!isValid || placeContract.isPending}
                className="h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-[0_4px_15px_rgba(220,38,38,0.3)] gap-2"
              >
                <ArrowDown className="size-6" /> FALL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-slate-800 bg-[#1e2329] overflow-hidden h-[450px]">
          <TradingViewChart symbol={symbol} />
        </div>

        <TradeHistory />
      </div>
    </div>
  );
}

function TradeHistory() {
  const history = trpc.trading.history.useQuery();
  const utils = trpc.useUtils();
  const settle = trpc.trading.settleContract.useMutation({
    onSuccess: () => {
      utils.trading.history.invalidate();
      utils.wallet.balances.invalidate();
      toast.success("Trade settled");
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <Card className="border-slate-800 bg-[#1e2329] shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Recent Trades</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => utils.trading.history.invalidate()} className="text-slate-500 hover:text-white">
          <History className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {history.data && history.data.length > 0 ? (
          <div className="space-y-3">
            {history.data.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0b0e11] border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${trade.direction === 'UP' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trade.direction === 'UP' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                  </div>
                  <div>
                    <div className="font-black text-white text-sm">{trade.symbol}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{trade.amount} USDT · {trade.durationSeconds}s · Entry: {trade.entryPrice}</div>
                  </div>
                </div>
                <div className="text-right">
                  {trade.status === 'open' ? (
                    <Button 
                      size="sm" 
                      onClick={() => settle.mutate({ tradeId: trade.id, symbol: trade.symbol as any })}
                      className="bg-[#f0b90b] text-black font-black text-[10px] h-7 px-3"
                    >
                      SETTLE
                    </Button>
                  ) : (
                    <div className={`text-xs font-black uppercase tracking-widest ${trade.status === 'won' ? 'text-green-500' : trade.status === 'lost' ? 'text-red-500' : 'text-slate-400'}`}>
                      {trade.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Activity className="size-6 text-slate-600" />
            </div>
            <div className="text-slate-400 text-sm font-bold">No active trades found</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TradingViewChart({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol === "XAUUSD" ? "OANDA:XAUUSD" : symbol === "XAGUSD" ? "OANDA:XAGUSD" : `BINANCE:${symbol}`,
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      calendar: false,
      backgroundColor: "rgba(11, 14, 17, 1)",
      gridColor: "rgba(30, 35, 41, 1)",
      container_id: "tv-chart",
    });
    container.current.appendChild(script);
  }, [symbol]);

  return <div id="tv-chart" ref={container} className="w-full h-full" />;
}

function SpotPage() {
  const me = trpc.auth.me.useQuery();
  if (!me.data) return <AuthPanel />;
  return <div className="py-20 text-center text-slate-500 font-black uppercase tracking-widest">Spot Trading coming soon</div>;
}

function AssetsPage() {
  const me = trpc.auth.me.useQuery();
  const balances = trpc.wallet.balances.useQuery(undefined, { enabled: !!me.data });
  if (!me.data) return <AuthPanel />;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">My Assets</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {balances.data?.map((w) => (
          <Card key={w.id} className="border-slate-800 bg-[#1e2329]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">{w.asset}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#f0b90b]">{Number(w.balance).toFixed(2)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const me = trpc.auth.me.useQuery();
  if (!me.data) return <AuthPanel />;
  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="border-slate-800 bg-[#1e2329]">
        <CardHeader className="text-center">
          <div className="size-20 rounded-full bg-[#f0b90b] text-black flex items-center justify-center mx-auto mb-4 font-black text-2xl">
            {me.data.email?.[0].toUpperCase()}
          </div>
          <CardTitle className="text-white">{me.data.email}</CardTitle>
          <div className="text-[#f0b90b] font-black uppercase tracking-widest text-xs">{me.data.vipLevel}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between p-3 rounded-lg bg-[#0b0e11] border border-slate-800">
            <span className="text-xs text-slate-500 font-bold uppercase">Role</span>
            <span className="text-xs text-white font-black uppercase">{me.data.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 text-center py-10">
      <h1 className="text-4xl font-black text-white uppercase tracking-tighter">About STGLOBAL</h1>
      <p className="text-slate-400 leading-relaxed">
        STGLOBAL is a leading professional cryptocurrency exchange providing institutional-grade trading tools and deep liquidity for global traders.
      </p>
    </div>
  );
}

export default function Home() {
  const [location] = useLocation();
  return (
    <Shell>
      {location === "/" && <HomePage />}
      {location === "/spot" && <SpotPage />}
      {location === "/contracts" && <ContractsPage />}
      {location === "/assets" && <AssetsPage />}
      {location === "/profile" && <ProfilePage />}
      {location === "/about" && <AboutPage />}
    </Shell>
  );
}

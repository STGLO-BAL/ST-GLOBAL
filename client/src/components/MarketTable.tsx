import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

function getSymbolIcon(symbol: string) {
  const s = symbol.toUpperCase();
  if (s.endsWith("USDT")) {
    const coin = s.replace("USDT", "").toLowerCase();
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coin}.png`;
  }
  if (s === "XAUUSD" || s === "XAGUSD") return "https://cdn-icons-png.flaticon.com/128/272/272531.png";
  if (s === "EURUSD") return "https://ui-avatars.com/api/?name=EU&background=0b0e11&color=fff";
  if (s === "GBPUSD") return "https://ui-avatars.com/api/?name=UK&background=0b0e11&color=fff";
  return `https://ui-avatars.com/api/?name=${s}&background=f0b90b&color=000`;
}

export function MarketTable() {
  const [activeTab, setActiveTab] = useState<"Hot" | "Crypto" | "Metals" | "Forex">("Hot");
  const [search, setSearch] = useState("");
  const market = trpc.market.snapshot.useQuery(undefined, { refetchInterval: 3000 });

  const data = market.data ? (
    activeTab === "Hot" ? market.data.hot :
    activeTab === "Crypto" ? market.data.crypto :
    activeTab === "Metals" ? market.data.metals :
    market.data.forex
  ) : [];

  const filteredData = data.filter(item => item.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-[#1e2329] border border-slate-800 p-1">
            <TabsTrigger value="Hot" className="data-[state=active]:bg-[#0b0e11] data-[state=active]:text-[#f0b90b] font-bold">Hot</TabsTrigger>
            <TabsTrigger value="Crypto" className="data-[state=active]:bg-[#0b0e11] data-[state=active]:text-[#f0b90b] font-bold">Crypto</TabsTrigger>
            <TabsTrigger value="Metals" className="data-[state=active]:bg-[#0b0e11] data-[state=active]:text-[#f0b90b] font-bold">Metals</TabsTrigger>
            <TabsTrigger value="Forex" className="data-[state=active]:bg-[#0b0e11] data-[state=active]:text-[#f0b90b] font-bold">Forex</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search pairs (e.g., BTC)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#1e2329] border-slate-800 text-white w-full sm:w-64 focus:border-[#f0b90b]"
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#1e2329] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#0b0e11]">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase text-xs tracking-widest">Pair</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-xs tracking-widest text-right">Price</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-xs tracking-widest text-right">24h Change</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-xs tracking-widest text-right hidden md:table-cell">24h Volume</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-xs tracking-widest text-right hidden lg:table-cell">24h Turnover</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-xs tracking-widest text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => {
              const isPositive = !row.change.startsWith("-");
              return (
                <TableRow key={row.symbol} className="border-slate-800 hover:bg-[#0b0e11]/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={getSymbolIcon(row.symbol)}
                        alt={row.symbol}
                        className="w-8 h-8 rounded-full bg-[#0b0e11]"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${row.symbol}&background=f0b90b&color=000`;
                        }}
                      />
                      <div>
                        <div className="font-black text-white">{row.symbol}</div>
                        <div className="text-[10px] text-slate-500 font-bold">Perpetual</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-white">
                    ${Number(row.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`inline-flex items-center justify-end gap-1 font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{row.change}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-400 font-bold hidden md:table-cell">
                    {(Math.random() * 10000 + 1000).toFixed(2)}M
                  </TableCell>
                  <TableCell className="text-right text-slate-400 font-bold hidden lg:table-cell">
                    ${(Math.random() * 500 + 50).toFixed(2)}M
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href="/contracts">
                      <Button size="sm" className="bg-slate-800 text-white hover:bg-[#f0b90b] hover:text-black font-black transition-colors">
                        Trade
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 font-bold">
                  No trading pairs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

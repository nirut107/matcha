"use client";

import React, { useState } from 'react';
import { Send, MoreVertical, Phone, Video, ChevronLeft, Search, Circle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Header from "@/components/Header";

const MOCK_MATCHES = [
  { id: 1, name: "Sarah", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400", lastMsg: "See you at 8?", time: "2m", online: true },
  { id: 2, name: "Alex", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400", lastMsg: "That sounds like a plan!", time: "1h", online: false },
  { id: 3, name: "Nirut", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400", lastMsg: "Hey, how's the coding going?", time: "3h", online: true },
];

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(MOCK_MATCHES[0]);
  const [isChatOpen, setIsChatOpen] = useState(false); // Track if we are viewing a conversation on mobile
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: 'them', text: "Hey! I saw you're also into coding.", time: "10:00 AM" },
    { id: 2, sender: 'me', text: "Yeah! Working on a project called Matcha right now.", time: "10:02 AM" },
    { id: 3, sender: 'them', text: "That's cool! Is it for school?", time: "10:05 AM" },
  ]);

  const handleSelectChat = (match: typeof MOCK_MATCHES[0]) => {
    setActiveChat(match);
    setIsChatOpen(true); // Open the chat window on mobile
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory([...chatHistory, newMsg]);
    setMessage("");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-grow bg-white overflow-hidden font-sans relative">

        {/* 1. MATCHES SIDEBAR */}
        <aside className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/50
          ${isChatOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard" className="text-gray-400 hover:text-rose-500 transition-colors">
                <ChevronLeft size={28} />
              </Link>
              <h1 className="text-xl font-black tracking-tight text-gray-900">MESSAGES</h1>
              <div className="w-7 h-7" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search matches..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-400/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            {MOCK_MATCHES.map((match) => (
              <div
                key={match.id}
                onClick={() => handleSelectChat(match)}
                className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-l-4 ${
                  activeChat.id === match.id ? 'bg-white border-rose-500 shadow-sm' : 'border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <img src={match.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                  {match.online && <Circle size={12} fill="#22c55e" className="text-green-500 absolute bottom-0 right-0 border-2 border-white rounded-full" />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-gray-900 truncate">{match.name}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{match.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{match.lastMsg}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 2. CHAT WINDOW */}
        <main className={`flex-grow flex-col bg-white
          ${isChatOpen ? 'flex' : 'hidden md:flex'}`}>

          {/* Chat Header */}
          <header className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {/* Back button for mobile */}
              <button
                onClick={() => setIsChatOpen(false)}
                className="md:hidden p-1 -ml-2 text-gray-500 hover:text-rose-500"
              >
                <ArrowLeft size={24} />
              </button>

              <img src={activeChat.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div>
                <h2 className="font-bold text-gray-900 leading-tight">{activeChat.name}</h2>
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                  {activeChat.online ? "Online" : "Away"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <button className="hover:text-rose-500 transition-colors"><Phone size={20} /></button>
              <button className="hover:text-rose-500 transition-colors"><Video size={20} /></button>
              <button className="hover:text-rose-500 transition-colors"><MoreVertical size={20} /></button>
            </div>
          </header>

          {/* Message Area */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/30">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm ${
                  msg.sender === 'me'
                  ? 'bg-gradient-to-tr from-rose-500 to-orange-400 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
            <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow py-4 pl-6 pr-14 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-rose-400/20 text-gray-900 text-sm transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 bg-gradient-to-r from-rose-500 to-orange-400 p-2.5 rounded-full text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

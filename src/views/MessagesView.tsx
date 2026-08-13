import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search, MoreVertical, Users, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MessagesView: React.FC = () => {
  const { 
    conversations, 
    messages, 
    sendChatMessage, 
    currentUser, 
    users, 
    selectedConversationId, 
    setSelectedConversationId,
    startChatWithUser 
  } = useApp();

  const [selectedConvId, setSelectedConvId] = useState<string>(
    selectedConversationId || conversations[0]?.id || ''
  );

  const [textInput, setTextInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Keep internal state synchronized with context selectedConversationId
  useEffect(() => {
    if (selectedConversationId) {
      setSelectedConvId(selectedConversationId);
    } else if (conversations.length > 0 && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [selectedConversationId, conversations]);

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0];
  const activeMessages = messages.filter(m => m.conversationId === activeConv?.id);

  const filteredConversations = conversations.filter(c => 
    c.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !activeConv) return;
    sendChatMessage(activeConv.id, textInput);
    setTextInput('');
  };

  const handleSelectUserToChat = (targetUserId: string) => {
    const convId = startChatWithUser(targetUserId);
    if (convId) {
      setSelectedConvId(convId);
    }
    setShowNewChatModal(false);
  };

  const availableUsersToChat = users.filter(u => 
    u.id !== currentUser?.id && (
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.kelas && u.kelas.toLowerCase().includes(userSearch.toLowerCase()))
    )
  );

  return (
    <div className="bg-white rounded-3xl border-2.5 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden flex flex-col md:flex-row h-[75vh] animate-fade-in mb-16 relative">
      
      {/* CONVERSATION LIST SIDEBAR */}
      <div className="w-full md:w-80 border-r-2 border-black p-4 flex flex-col bg-[#F7F7F0]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-black stroke-[2.5]" />
            <h2 className="font-heading font-black text-base text-black">Pesan Langsung</h2>
          </div>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="neo-btn px-2.5 py-1 text-xs bg-[#B8FF00] text-black flex items-center gap-1 font-black"
            title="Mulai Chat Baru"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Baru</span>
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-black stroke-[2.5] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neo-input w-full pl-8 pr-3 py-2 text-xs"
          />
        </div>

        {conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-3">
            <Users className="w-10 h-10 text-gray-400 stroke-[2]" />
            <p className="text-xs font-black text-black">Belum ada obrolan</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="neo-btn px-4 py-2 text-xs bg-[#FFE600] text-black font-black"
            >
              + Mulai Chat Teman / Admin
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 overflow-y-auto flex-1 no-scrollbar pr-1">
            {filteredConversations.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setSelectedConversationId(conv.id);
                  }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between border-2 border-black ${
                    isSelected
                      ? 'bg-[#0B0B0B] text-white shadow-[2px_2px_0px_0px_#35B9FF]'
                      : 'bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_#000]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={conv.participant?.avatar} 
                      alt={conv.participant?.name} 
                      className="w-10 h-10 rounded-xl object-cover border-2 border-black"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-black'}`}>
                        {conv.participant?.name}
                      </p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-gray-300 font-medium' : 'text-gray-700 font-bold'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold shrink-0 ml-1 ${isSelected ? 'text-[#B8FF00]' : 'text-gray-600'}`}>
                    {conv.lastMessageTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHAT MESSAGES DISPLAY */}
      {activeConv ? (
        <div className="flex-1 flex flex-col justify-between bg-white">
          {/* Chat Header */}
          <div className="p-3.5 border-b-2 border-black flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <img 
                src={activeConv.participant?.avatar} 
                alt={activeConv.participant?.name} 
                className="w-10 h-10 rounded-xl object-cover border-2 border-black shadow-[2px_2px_0px_0px_#000]"
              />
              <div>
                <h3 className="font-heading font-black text-xs text-black flex items-center gap-1.5">
                  <span>{activeConv.participant?.name}</span>
                  <span className="text-[9px] bg-[#35B9FF] text-black px-1.5 py-0.2 rounded border border-black uppercase font-black">
                    {activeConv.participant?.userType}
                  </span>
                </h3>
                <p className="text-[10px] text-gray-700 font-bold">
                  @{activeConv.participant?.username}
                </p>
              </div>
            </div>

            <button 
              onClick={() => alert('Opsi percakapan telah dibuka.')}
              className="p-1.5 text-black hover:bg-gray-100 rounded-xl border border-transparent hover:border-black"
            >
              <MoreVertical className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Messages Bubble Area */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-[#F7F7F0]">
            {activeMessages.length === 0 ? (
              <div className="text-center py-12 text-black text-xs font-bold bg-white p-6 rounded-2xl border-2 border-dashed border-black max-w-sm mx-auto">
                Belum ada percakapan dengan {activeConv.participant?.name}. Kirim pesan pertama Anda!
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] p-3 rounded-2xl text-xs font-body border-2 border-black ${
                      isMe 
                        ? 'bg-[#0B0B0B] text-white rounded-br-none shadow-[2px_2px_0px_0px_#B8FF00]' 
                        : 'bg-white text-black rounded-bl-none shadow-[2px_2px_0px_0px_#000]'
                    }`}>
                      <p className="font-medium whitespace-pre-line">{msg.text}</p>
                      <span className={`text-[9px] block text-right mt-1 font-bold ${isMe ? 'text-[#B8FF00]' : 'text-gray-600'}`}>
                        {msg.createdAt}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Chat */}
          <form onSubmit={handleSend} className="p-3 border-t-2 border-black flex items-center gap-2 bg-white">
            <input
              type="text"
              placeholder="Tulis pesan kamu..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="neo-input flex-1 px-4 py-2.5 text-xs"
            />
            <button
              type="submit"
              className="neo-btn p-2.5 bg-[#B8FF00] text-black flex items-center justify-center"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-3">
          <MessageSquare className="w-12 h-12 text-black stroke-[2]" />
          <p className="font-heading font-black text-sm text-black">Pilih Percakapan</p>
          <p className="text-xs text-gray-700 font-bold max-w-xs">Pilih salah satu teman di daftar sebelah kiri atau klik 'Baru' untuk memulai pesan.</p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="neo-btn px-5 py-2.5 text-xs bg-[#B8FF00] text-black font-black"
          >
            + Chat Teman / Admin
          </button>
        </div>
      )}

      {/* NEW CHAT USER PICKER MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-black w-full max-w-md rounded-3xl p-6 border-2.5 border-black shadow-[6px_6px_0px_0px_#000] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Users className="w-5 h-5 stroke-[2.5]" />
                <span>Mulai Chat Baru</span>
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg border-2 border-black hover:bg-gray-100"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Cari nama teman, admin, atau kelas..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="neo-input w-full px-3.5 py-2 text-xs"
            />

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {availableUsersToChat.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-700 font-bold">
                  Tidak ada pengguna ditemukan.
                </div>
              ) : (
                availableUsersToChat.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUserToChat(u.id)}
                    className="p-3 bg-[#F7F7F0] rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-between cursor-pointer hover:bg-[#FFE600] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={u.avatar} 
                        alt={u.name} 
                        className="w-10 h-10 rounded-xl object-cover border-2 border-black"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-black truncate">{u.name}</p>
                        <p className="text-[10px] text-gray-700 font-bold truncate">@{u.username} • {u.userType}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-black text-white font-black px-2.5 py-1 rounded-lg border border-black shrink-0">
                      Chat
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


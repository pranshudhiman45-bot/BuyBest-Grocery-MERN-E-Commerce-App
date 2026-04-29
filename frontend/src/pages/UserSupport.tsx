import React, { useEffect, useState, useRef } from "react"
import axios from "axios"
import { io, Socket } from "socket.io-client"
import { ArrowLeft, Clock, MessageSquare, Send, Tag, Ticket as TicketIcon, LifeBuoy } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "")

type Message = {
  _id?: string
  sender: string
  senderId?: string
  senderName?: string
  senderRole?: string
  text: string
  createdAt?: string
}

type IncomingMessage = Message & {
  ticketId?: string
}

type Ticket = {
  _id: string
  title: string
  description: string
  status: string
  messages: Message[]
}

const getMessageSenderId = (message: Message) => message.senderId || message.sender

const getMessageSenderRole = (message: Message) => message.senderRole || "user"

const formatMessageTime = (createdAt?: string) => {
  if (!createdAt) return ""

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt))
}

const UserSupport = ({ currentUser }: { currentUser: AuthUser | null }) => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [chatMessage, setChatMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/support/my-tickets`, {
        withCredentials: true,
      })
      setTickets(res.data.tickets)
    } catch (err) {
      console.error("Failed to fetch tickets", err)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await axios.post(
        `${API_BASE_URL}/api/support`,
        { title: newTitle, description: newDescription },
        { withCredentials: true }
      )
      setNewTitle("")
      setNewDescription("")
      fetchTickets()
    } catch (err) {
      console.error("Failed to create ticket", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const joinTicketChat = (ticket: Ticket) => {
    setActiveTicket(ticket)
    if (socketRef.current) {
      socketRef.current.emit("join_ticket", ticket._id)
    }
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || !activeTicket || !currentUser) return

    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        ticketId: activeTicket._id,
        senderId: currentUser.id,
        text: chatMessage,
      })
      setChatMessage("")
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    const socket = io(API_BASE_URL, { withCredentials: true })
    socketRef.current = socket

    socket.on("receive_message", (message: IncomingMessage) => {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === message.ticketId
            ? { ...ticket, messages: [...ticket.messages, message] }
            : ticket
        )
      )

      setActiveTicket((prev) => {
        if (!prev) return prev
        if (message.ticketId && prev._id !== message.ticketId) return prev
        if (!message.ticketId) return prev

        const messages = [...prev.messages, message]
        return { ...prev, messages }
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeTicket?.messages])

  return (
    <div className="min-h-full bg-[#f7f4ee] text-[#262118]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-3 pb-12 pt-4 md:px-5">
        
        {/* Support Header Section - Matching Offers Page Gradient */}
        <section className="overflow-hidden rounded-[30px] border border-[#ece4d6] bg-[linear-gradient(135deg,#fffdf9_0%,#f8f4ea_48%,#eef8ee_100%)] shadow-[0_18px_40px_rgba(78,62,31,0.08)]">
          <div className="relative px-5 py-6 lg:px-7 lg:py-8">
            <div className="absolute -left-8 top-0 h-36 w-36 rounded-full bg-[#ffd96a]/35 blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#af9452]">
                Help Center
              </p>
              <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-[1.05] text-[#2a2217] sm:text-5xl">
                How can we support <br className="hidden sm:block" /> you today?
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#7d6d52] sm:text-base">
                Whether you have a question about an order or need help with your account, our team is here to assist you quickly and securely.
              </p>
            </div>
          </div>
        </section>

        {!activeTicket ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            
            {/* Create Ticket Card */}
            <div className="rounded-[28px] border border-[#ece4d6] bg-white p-6 shadow-[0_12px_28px_rgba(78,62,31,0.06)] sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4fbf6] text-[#0d7a45]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2a2217]">Submit a Request</h2>
                  <p className="text-sm text-[#7d6d52]">We typically reply within a few minutes.</p>
                </div>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#4e422c] mb-2">Subject</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl border border-[#e8dfcf] bg-[#fdfbf6] text-sm font-medium text-[#2a2217] shadow-sm outline-none transition-colors hover:border-[#d4c3a3] focus:border-[#a78410] focus:ring-1 focus:ring-[#a78410]"
                    placeholder="e.g. My order hasn't arrived"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4e422c] mb-2">How can we help?</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full min-h-[120px] p-4 rounded-2xl border border-[#e8dfcf] bg-[#fdfbf6] text-sm font-medium text-[#2a2217] shadow-sm outline-none transition-colors hover:border-[#d4c3a3] focus:border-[#a78410] focus:ring-1 focus:ring-[#a78410] resize-none"
                    placeholder="Provide details about your issue..."
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newTitle.trim() || !newDescription.trim()}
                  className="w-full h-12 rounded-2xl bg-[#0d7a45] text-white font-bold tracking-wide hover:bg-[#0a6539] hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Send Secure Message"}
                </Button>
              </form>
            </div>

            {/* Ticket List Card */}
            <div className="rounded-[28px] border border-[#ece4d6] bg-white p-6 shadow-[0_12px_28px_rgba(78,62,31,0.06)] sm:p-8 flex min-h-[320px] flex-col md:min-h-[420px] lg:min-h-[550px]">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fdf6e3] text-[#b08b16]">
                  <TicketIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2a2217]">Recent Issues</h2>
                  <p className="text-sm text-[#7d6d52]">Track your open requests.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="h-20 w-20 rounded-full bg-[#f8f4ea] flex items-center justify-center mb-4 border border-[#ece4d6]/60 shadow-inner">
                      <Tag className="h-8 w-8 text-[#d4c3a3]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#4e422c]">No active requests</h3>
                    <p className="text-sm text-[#8c7d60] mt-1 max-w-50">
                      Your support history will appear here.
                    </p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      onClick={() => joinTicketChat(ticket)}
                      className="group p-4 rounded-[20px] border border-[#e8dfcf] bg-white cursor-pointer hover:border-[#d4c3a3] hover:shadow-sm transition-all active:scale-[0.99] block"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-semibold text-[#2a2217] line-clamp-1">{ticket.title}</h3>
                        <span
                          className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full ${
                            ticket.status === "open" 
                              ? "bg-[#ccffcf]/60 text-[#1a5b32] border border-[#a3e6a9]" 
                              : "bg-[#f2f2f2] text-[#6b6b6b] border border-[#e0e0e0]"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#7d6d52] line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#a0937a]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ticket.messages.length} message{ticket.messages.length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Active Chat View */
          <div className="bg-white flex min-h-[65svh] flex-col overflow-hidden rounded-[30px] border border-[#ece4d6] shadow-[0_18px_40px_rgba(78,62,31,0.08)] sm:min-h-[70svh] lg:min-h-[650px] lg:max-h-[85vh]">
            
            {/* Chat Header */}
            <div className="bg-[linear-gradient(135deg,#fffdf9_0%,#f8f4ea_100%)] p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-[#ece4d6] gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setActiveTicket(null)}
                  className="h-10 w-10 shrink-0 rounded-full border border-[#e8dfcf] bg-white text-[#7d6d52] hover:bg-[#faf5ea] hover:text-[#4e422c]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#2a2217] line-clamp-1 pr-2">{activeTicket.title}</h2>
                  <div className="flex items-center mt-0.5 gap-2">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${
                        activeTicket.status === "open" 
                          ? "bg-[#ccffcf]/60 text-[#1a5b32]" 
                          : "bg-[#f2f2f2] text-[#6b6b6b]"
                      }`}
                    >
                      {activeTicket.status}
                    </span>
                    <span className="text-xs text-[#8c7d60]">Ticket #{activeTicket._id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#fcfbfa] custom-scrollbar">
              {activeTicket.messages.map((msg, i) => {
                const isMine = getMessageSenderId(msg) === currentUser?.id
                const isSupportMessage = getMessageSenderRole(msg) === "support"
                const senderLabel = isSupportMessage ? "Store Support" : "You"
                
                return (
                  <div key={msg._id || `${msg.createdAt || "message"}-${i}`} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                    <div className="flex max-w-[92%] items-end gap-2 sm:max-w-[80%] lg:max-w-[70%]">
                      {!isMine && (
                         <div className="shrink-0 h-8 w-8 rounded-full bg-[#1b9858] flex items-center justify-center text-white shadow-sm mb-1">
                           <LifeBuoy className="h-4 w-4" />
                         </div>
                      )}
                      
                      <div
                        className={`p-3.5 sm:p-4 text-sm sm:text-base leading-relaxed shadow-sm ${
                          isMine
                            ? "bg-[#0d7a45] text-white rounded-[22px] rounded-br-[8px]"
                            : "bg-white border border-[#ece4d6] text-[#2c2417] rounded-[22px] rounded-bl-[8px]"
                        }`}
                      >
                        <div className={`mb-1.5 flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase ${isMine ? "text-white/80" : "text-[#b0a48e]"}`}>
                          <span>{senderLabel}</span>
                          {msg.createdAt && (
                            <>
                              <span className="opacity-50">•</span>
                              <span className={isMine ? "text-white/70" : "text-[#bcae97]"}>{formatMessageTime(msg.createdAt)}</span>
                            </>
                          )}
                        </div>
                        <p className="break-words">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={chatBottomRef} className="h-2" />
            </div>

            {/* Chat Composer */}
            {activeTicket.status === "open" ? (
              <div className="p-4 sm:p-5 bg-white border-t border-[#ece4d6]">
                <form onSubmit={sendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="w-full h-14 pl-5 pr-16 rounded-[28px] border border-[#e8dfcf] bg-[#fdfbf6] text-[15px] font-medium text-[#2a2217] shadow-inner outline-none transition-colors hover:border-[#d4c3a3] focus:border-[#a78410] focus:ring-1 focus:ring-[#a78410]"
                    placeholder="Reply to this ticket..."
                  />
                  <Button 
                    type="submit" 
                    disabled={!chatMessage.trim()}
                    className="absolute right-2 h-10 w-10 p-0 rounded-full bg-[#10382e] hover:bg-[#0c2a23] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </Button>
                </form>
                <p className="text-center mt-2 text-[11px] text-[#a0937a]">Press enter to send securely.</p>
              </div>
            ) : (
              <div className="p-5 bg-[#fdfbf6] border-t border-[#ece4d6] text-center">
                <p className="text-sm font-medium text-[#8c7d60]">This ticket has been marked as closed.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSupport

import React, { useEffect, useState, useRef } from "react"
import axios from "axios"
import { io, Socket } from "socket.io-client"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth"
import { API_BASE_URL } from "@/lib/api-config"

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

type OrderHistoryItem = {
  _id: string
  orderId: string
  productDetails: {
    _id: string
    name: string
    image: string[]
  }
  total: number
  paymentStatus: string
  createdAt: string
}

type Ticket = {
  _id: string
  title: string
  description: string
  status: string
  messages: Message[]
  user: {
    _id: string
    name: string
    email: string
    mobile?: string
    orderHistory?: OrderHistoryItem[]
  }
}

const getMessageSenderId = (message: Message) => message.senderId || message.sender

const getMessageSenderRole = (message: Message) => message.senderRole || "user"

const getMessageSenderName = (message: Message) => {
  if (message.senderName?.trim()) {
    return message.senderName
  }

  return getMessageSenderRole(message) === "support" ? "Support Agent" : "Customer"
}

const formatMessageTime = (createdAt?: string) => {
  if (!createdAt) return ""

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt))
}

const SupportPanel = ({ currentUser }: { currentUser: AuthUser | null }) => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [chatMessage, setChatMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const socketRef = useRef<Socket | null>(null)
  const chatBottomRef = useRef<HTMLDivElement | null>(null)

  const fetchAllTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/support/all`, {
        withCredentials: true,
      })
      setTickets(res.data.tickets)
    } catch (err) {
      console.error("Failed to fetch all tickets", err)
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

  const closeTicket = async () => {
    if (!activeTicket) return
    try {
      await axios.patch(`${API_BASE_URL}/api/support/${activeTicket._id}/close`, {}, { withCredentials: true })
      setActiveTicket({ ...activeTicket, status: 'closed' })
      fetchAllTickets()
    } catch(err) {
      console.error("Failed to close ticket", err)
    }
  }

  useEffect(() => {
    fetchAllTickets()
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
        if (!prev) {
          return prev
        }

        if (message.ticketId && prev._id !== message.ticketId) {
          return prev
        }

        if (!message.ticketId) {
          return prev
        }

        const messages = [...prev.messages, message]
        return { ...prev, messages }
      })
    })

    socket.on("new_ticket", (ticket: Ticket) => {
      setTickets((prev) => {
        // Prevent duplicate tickets
        if (prev.find((t) => t._id === ticket._id)) return prev
        return [ticket, ...prev]
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

  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase()
    return (
      t.title.toLowerCase().includes(q) ||
      t.user?.email.toLowerCase().includes(q) ||
      t.user?.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#fcf8ef] md:flex-row">
      {/* Sidebar for Ticket List */}
      <div
        className={`border-[#ece4d6] bg-white md:w-[340px] md:shrink-0 md:border-r lg:w-[32%] ${
          activeTicket ? "hidden md:block" : "block"
        }`}
      >
        <div className="p-4 border-b border-[#ece4d6] sticky top-0 bg-white shadow-sm z-10 flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1B4D3E]">Support Dashboard</h2>
            <p className="text-sm text-[#7d6d52]">Respond to active customer problems</p>
          </div>
          <input
            type="text"
            placeholder="Search email, name or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[#e6dcc9] focus:ring-[#c8aa45] focus:border-[#c8aa45] outline-none text-sm transition shadow-sm"
          />
        </div>

        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-2 space-y-2 md:max-h-[calc(100vh-8rem)]">
          {filteredTickets.length === 0 ? (
            <p className="p-4 text-center text-[#8f8168]">No tickets match search.</p>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => joinTicketChat(ticket)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  activeTicket?._id === ticket._id
                    ? "bg-[#faf4e8] border-[#c8aa45]"
                    : "border-[#ece4d6] hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm text-[#2c2417] truncate pr-2">{ticket.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                      ticket.status === "open" ? "bg-red-100 text-red-700 font-bold" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ticket.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[#7d6d52] line-clamp-1 mb-2">From: {ticket.user?.name}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex-col bg-white ${
          activeTicket ? "flex" : "hidden md:flex"
        }`}
      >
        {!activeTicket ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#8f8168]">Select a request from the left to start responding.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-[#ece4d6] bg-[#faf4e8] shadow-sm z-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-[#e6dcc9] bg-white text-[#7d6d52] md:hidden"
                    onClick={() => setActiveTicket(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="font-bold text-[#1B4D3E] text-lg">{activeTicket.title}</h2>
                    <p className="text-sm text-[#7d6d52]">Ticket ID: #{activeTicket._id.slice(-6)}</p>
                  </div>
                </div>
                <div>
                  {activeTicket.status === "open" ? (
                    <Button variant="destructive" onClick={closeTicket} className="rounded-full shadow-sm hover:shadow-md">
                      Resolve & Close
                    </Button>
                  ) : (
                    <span className="inline-flex text-gray-500 font-medium px-4 py-2 border border-gray-300 rounded-full bg-gray-100 shadow-inner">
                      Ticket Closed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded User Demographics Context Box -> Replaced with Real User & Order Info */}
            <div className="bg-[#fdfbf7] border-b border-[#ece4d6] flex flex-col text-sm text-[#7d6d52] shadow-inner">
              <div className="px-4 py-4 flex flex-col gap-6 border-b border-[#ece4d6]/50 sm:px-6 lg:flex-row">
                <div className="flex min-w-0 items-center gap-3 lg:w-[280px] lg:shrink-0">
                   <div className="min-w-12 w-12 h-12 rounded-full bg-gradient-to-br from-[#1B4D3E] to-[#2c7a65] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                     {activeTicket.user?.name?.charAt(0) || "?"}
                   </div> 
                   <div className="min-w-0">
                     <p className="font-semibold text-[#1B4D3E] text-base truncate">{activeTicket.user?.name}</p>
                     <p className="text-xs text-[#8f8168] truncate">{activeTicket.user?.email}</p>
                     <p className="text-xs text-[#8f8168] mt-0.5 font-medium"><span className="text-[#2c2417]/60">Mobile:</span> {activeTicket.user?.mobile || "Not Provided"}</p>
                   </div>
                </div>
                <div className="flex-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-[#c8aa45] mb-2 sticky top-0 bg-[#fdfbf7] z-10 py-1 border-b border-[#ece4d6]/30">Customer Order History</h4>
                   {activeTicket.user?.orderHistory && activeTicket.user.orderHistory.length > 0 ? (
                     <div className="space-y-2 pb-1">
                       {activeTicket.user.orderHistory.map(order => (
                         <div key={order._id} className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-[#ece4d6] text-xs shadow-sm transition sm:flex-row sm:items-center sm:justify-between">
                           <div className="min-w-0 pr-0 sm:pr-4 flex-1">
                             <p className="font-semibold text-[#1B4D3E] truncate">{order.productDetails?.name || "Product Item"}</p>
                             <p className="text-gray-500 font-mono text-[10px] mt-0.5">ID: {order.orderId}</p>
                           </div>
                           <div className="shrink-0 sm:text-right">
                             <p className="font-bold text-[#c8aa45]">₹{order.total}</p>
                             <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 inline-block ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                               {order.paymentStatus?.toUpperCase() || 'UNKNOWN'}
                             </span>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-xs text-[#8f8168] italic mt-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> No previous orders found for this user.
                     </p>
                   )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/60 border-b border-[#ece4d6]">
              <h4 className="text-xs font-bold tracking-wider uppercase text-[#c8aa45] mb-2">Original Problem Description:</h4>
              <p className="text-sm text-gray-800 bg-[#fefdfb] border border-[#f0eadf] p-3 rounded-lg">{activeTicket.description}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {activeTicket.messages.map((msg, i) => {
                const isMine = getMessageSenderId(msg) === currentUser?.id
                const senderRole = getMessageSenderRole(msg)
                const isSupportMessage = senderRole === "support"
                const senderLabel = isMine ? "You" : getMessageSenderName(msg)
                return (
                  <div key={msg._id || `${msg.createdAt || "message"}-${i}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl sm:max-w-[78%] lg:max-w-[70%] ${
                        isMine
                          ? "bg-[#c8aa45] text-white rounded-br-none"
                          : isSupportMessage
                            ? "bg-[#edf7f3] border border-[#cfe8dd] text-[#1f4d3d] rounded-bl-none shadow-sm"
                            : "bg-white border border-[#ece4d6] text-[#2c2417] rounded-bl-none shadow-sm"
                      }`}
                    >
                      <div className={`mb-1 flex items-center gap-2 text-[11px] font-semibold ${isMine ? "text-white/85" : "text-[#8f8168]"}`}>
                        <span>{senderLabel}</span>
                        <span className={`rounded-full px-2 py-0.5 uppercase tracking-wide ${isMine ? "bg-white/20 text-white" : isSupportMessage ? "bg-[#d8efe5] text-[#1f6a52]" : "bg-[#f4ead8] text-[#8a6a1f]"}`}>
                          {isSupportMessage ? "Support" : "Customer"}
                        </span>
                        {msg.createdAt ? <span className={isMine ? "text-white/70" : "text-[#a3957d]"}>{formatMessageTime(msg.createdAt)}</span> : null}
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={chatBottomRef} />
            </div>

            {activeTicket.status === "open" && (
              <div className="p-4 bg-white border-t border-[#ece4d6]">
                <form onSubmit={sendMessage} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 h-12 px-4 rounded-xl border border-[#e6dcc9] focus:ring-[#c8aa45] focus:border-[#c8aa45] outline-none shadow-sm"
                    placeholder="Type your response to the customer..."
                  />
                  <Button type="submit" className="h-12 w-full rounded-xl bg-[#1B4D3E] hover:bg-[#163d32] text-white font-medium sm:w-24">
                    Reply
                  </Button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SupportPanel

import React, { useEffect, useState, useRef } from "react"
import axios from "axios"
import { io, Socket } from "socket.io-client"
import { useStore } from "@/components/providers/store-provider"
import { Button } from "@/components/ui/button"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "")

type Message = {
  _id?: string
  sender: string
  text: string
  createdAt?: string
}

type OrderHistoryItem = {
  _id: string;
  orderId: string;
  productDetails: { _id: string; name: string; image: any[] };
  total: number;
  paymentStatus: string;
  createdAt: string;
}

type Ticket = {
  _id: string
  title: string
  description: string
  status: string
  messages: Message[]
  user: {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
    orderHistory?: OrderHistoryItem[];
  }
}

const SupportPanel = ({ currentUser }: { currentUser: any }) => {
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
        senderId: currentUser.id || (currentUser as any)._id,
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

    socket.on("receive_message", (message: Message) => {
      setActiveTicket((prev) => {
        // Only append to active ticket if it matches!
        if (prev && prev._id === message.ticketId || !message.ticketId) {
          const messages = [...prev.messages, message]
          return { ...prev, messages }
        }
        return prev
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
    <div className="flex h-[calc(100vh-4rem)] bg-[#fcf8ef]">
      {/* Sidebar for Ticket List */}
      <div className="w-1/3 border-r border-[#ece4d6] bg-white overflow-y-auto">
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

        <div className="p-2 space-y-2">
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
      <div className="flex-1 flex flex-col bg-white">
        {!activeTicket ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#8f8168]">Select a ticket from the left to start responding.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-[#ece4d6] bg-[#faf4e8] flex justify-between items-center shadow-sm z-10">
              <div>
                <h2 className="font-bold text-[#1B4D3E] text-lg">{activeTicket.title}</h2>
                <p className="text-sm text-[#7d6d52]">Ticket ID: #{activeTicket._id.slice(-6)}</p>
              </div>
              {activeTicket.status === "open" ? (
                <Button variant="destructive" onClick={closeTicket} className="rounded-full shadow-sm hover:shadow-md">
                  Resolve & Close
                </Button>
              ) : (
                <span className="text-gray-500 font-medium px-4 py-2 border border-gray-300 rounded-full bg-gray-100 shadow-inner">
                  Ticket Closed
                </span>
              )}
            </div>

            {/* Expanded User Demographics Context Box -> Replaced with Real User & Order Info */}
            <div className="bg-[#fdfbf7] border-b border-[#ece4d6] flex flex-col text-sm text-[#7d6d52] shadow-inner">
              <div className="px-6 py-4 flex flex-col min-h-24 sm:flex-row gap-6 border-b border-[#ece4d6]/50">
                <div className="flex items-center gap-3 w-1/3">
                   <div className="min-w-12 w-12 h-12 rounded-full bg-gradient-to-br from-[#1B4D3E] to-[#2c7a65] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                     {activeTicket.user?.name?.charAt(0) || "?"}
                   </div> 
                   <div className="truncate">
                     <p className="font-semibold text-[#1B4D3E] text-base truncate">{activeTicket.user?.name}</p>
                     <p className="text-xs text-[#8f8168] truncate">{activeTicket.user?.email}</p>
                     <p className="text-xs text-[#8f8168] mt-0.5 font-medium"><span className="text-[#2c2417]/60">Mobile:</span> {activeTicket.user?.mobile || "Not Provided"}</p>
                   </div>
                </div>
                <div className="flex-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-[#c8aa45] mb-2 sticky top-0 bg-[#fdfbf7] z-10 py-1 border-b border-[#ece4d6]/30">Customer Order History</h4>
                   {activeTicket.user?.orderHistory && activeTicket.user.orderHistory.length > 0 ? (
                     <div className="space-y-2 pb-1">
                       {activeTicket.user.orderHistory.map(order => (
                         <div key={order._id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-[#ece4d6] text-xs shadow-sm hover:shadow-md transition">
                           <div className="truncate pr-4 flex-1">
                             <p className="font-semibold text-[#1B4D3E] truncate">{order.productDetails?.name || "Product Item"}</p>
                             <p className="text-gray-500 font-mono text-[10px] mt-0.5">ID: {order.orderId}</p>
                           </div>
                           <div className="text-right shrink-0">
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
                const isMine = msg.sender === currentUser?.id
                return (
                  <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        isMine ? "bg-[#c8aa45] text-white rounded-br-none" : "bg-white border border-[#ece4d6] text-[#2c2417] rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={chatBottomRef} />
            </div>

            {activeTicket.status === "open" && (
              <div className="p-4 bg-white border-t border-[#ece4d6]">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 h-12 px-4 rounded-xl border border-[#e6dcc9] focus:ring-[#c8aa45] focus:border-[#c8aa45] outline-none shadow-sm"
                    placeholder="Type your response to the customer..."
                  />
                  <Button type="submit" className="h-12 w-24 rounded-xl bg-[#1B4D3E] hover:bg-[#163d32] text-white font-medium">
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

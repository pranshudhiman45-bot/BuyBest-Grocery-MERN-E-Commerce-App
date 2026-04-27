import React, { useEffect, useState, useRef } from "react"
import axios from "axios"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "")

type Message = {
  _id?: string
  sender: string
  text: string
  createdAt?: string
}

type Ticket = {
  _id: string
  title: string
  description: string
  status: string
  messages: Message[]
}

const UserSupport = ({ currentUser }: { currentUser: any }) => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [chatMessage, setChatMessage] = useState("")
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
    if (!newTitle.trim() || !newDescription.trim()) return

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

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    const socket = io(API_BASE_URL, { withCredentials: true })
    socketRef.current = socket

    socket.on("receive_message", (message: Message & { ticketId?: string }) => {
      setActiveTicket((prev) => {
        if (prev && prev._id === message.ticketId || !message.ticketId) {
          const messages = [...prev.messages, message]
          return { ...prev, messages }
        }
        return prev
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-[#1B4D3E] mb-6">Customer Support</h1>

      {!activeTicket ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#ece4d6]">
            <h2 className="text-xl font-semibold mb-4 text-[#2c2417]">Create a New Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#7d6d52] mb-1">Issue Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#e6dcc9] focus:ring-[#c8aa45] focus:border-[#c8aa45] outline-none"
                  placeholder="e.g. My order hasn't arrived"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7d6d52] mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#e6dcc9] focus:ring-[#c8aa45] focus:border-[#c8aa45] outline-none"
                  rows={4}
                  placeholder="Describe your problem..."
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#1B4D3E] hover:bg-[#163d32] text-white">
                Submit Problem
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-[#2c2417]">Your Support Tickets</h2>
            {tickets.length === 0 ? (
              <p className="text-[#8f8168]">You don't have any support tickets yet.</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    onClick={() => joinTicketChat(ticket)}
                    className="p-4 rounded-xl border border-[#ece4d6] bg-white cursor-pointer hover:bg-[#faf4e8] transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#1B4D3E]">{ticket.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          ticket.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-[#7d6d52] line-clamp-2">{ticket.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white flex flex-col h-[600px] rounded-2xl shadow-sm border border-[#ece4d6] overflow-hidden">
          <div className="bg-[#faf4e8] p-4 flex justify-between items-center border-b border-[#ece4d6]">
            <div>
              <h2 className="text-lg font-bold text-[#1B4D3E]">{activeTicket.title}</h2>
              <span className="text-xs text-[#7d6d52]">Status: {activeTicket.status}</span>
            </div>
            <Button variant="outline" onClick={() => setActiveTicket(null)}>
              Back to List
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {activeTicket.messages.map((msg, i) => {
              const isMine = msg.sender === currentUser?.id
              return (
                <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      isMine ? "bg-[#1B4D3E] text-white rounded-br-none" : "bg-white border border-[#ece4d6] text-[#2c2417] rounded-bl-none"
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
                  className="flex-1 h-10 px-4 rounded-full border border-[#e6dcc9] focus:ring-[#c8aa45] focus:border-[#c8aa45] outline-none"
                  placeholder="Type your message..."
                />
                <Button type="submit" className="rounded-full bg-[#1B4D3E] hover:bg-[#163d32] text-white px-6">
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserSupport

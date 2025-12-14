import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Bot,
  User,
  Phone,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Loader2,
  Building2,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  properties?: Property[]
  timestamp: Date
  model?: string
}

interface Property {
  id: string
  address: string
  city: string
  county?: string
  price: number
  beds?: number
  baths_total?: number
  sqft?: number
  lot_size_acres?: number
  year_built?: number
  property_type?: string
  status: string
  description?: string
  listing_url?: string
  image_urls?: string[]
  listing_agent?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Supabase configuration
const SUPABASE_URL = 'https://blfieqovcvzgiucuymen.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODM1MDcsImV4cCI6MjA2OTQ1OTUwN30.VbdUB8Gz-mNzb5BbsAWlHk_tYlgyt1sipUwUaCDxdDU'

// LLM Edge Function URL (H200 with OpenAI fallback)
const LLM_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ky-realestate-bot`

// Format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price)
}

// Property Card Component
function PropertyCard({ property }: { property: Property }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-white">
      <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
        <Building2 className="h-12 w-12 text-blue-400" />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-lg text-blue-600">{formatPrice(property.price)}</h4>
          <Badge variant={property.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
            {property.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-700 font-medium mb-1">{property.address}</p>
        <p className="text-xs text-gray-500 mb-3">{property.city}, KY {property.county && `(${property.county})`}</p>

        <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-3">
          {property.beds && (
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" /> {property.beds} bed
            </span>
          )}
          {property.baths_total && (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" /> {property.baths_total} bath
            </span>
          )}
          {property.sqft && (
            <span className="flex items-center gap-1">
              <Square className="h-3 w-3" /> {property.sqft.toLocaleString()} sqft
            </span>
          )}
          {property.lot_size_acres && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {property.lot_size_acres} acres
            </span>
          )}
        </div>

        {property.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{property.description}</p>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
            onClick={() => window.location.href = 'tel:606-224-3261'}
          >
            <Phone className="h-3 w-3 mr-1" /> Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => window.location.href = 'mailto:thouse@century21advantage.com?subject=Property Inquiry: ' + property.address}
          >
            <Calendar className="h-3 w-3 mr-1" /> Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Bot Component
export default function BotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome to The House Team's Kentucky Real Estate Assistant! I'm powered by advanced AI to help you find your perfect home in Kentucky.\n\nI can help you:\n- **Search for properties** by location, price, bedrooms, and more\n- **Answer questions** about Kentucky real estate laws and regulations\n- **Explain contracts** and the home buying/selling process\n- **Provide negotiation tips** and market insights\n\nTry asking something like:\n- "Show me 3 bedroom homes in London under $300,000"\n- "What are Kentucky's disclosure requirements?"\n- "How does the home buying process work in Kentucky?"`,
      timestamp: new Date()
    }
  ])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Add to chat history for context
    const newChatHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: input.trim() }
    ]
    setChatHistory(newChatHistory)

    setInput('')
    setIsLoading(true)

    try {
      // Call the LLM Edge Function (H200 with OpenAI fallback)
      const response = await fetch(LLM_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          messages: newChatHistory.slice(-10), // Keep last 10 messages for context
          sessionId: sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Unknown error')
      }

      // Add assistant response to chat history
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: data.message }
      ])

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        properties: data.properties?.length > 0 ? data.properties : undefined,
        timestamp: new Date(),
        model: data.model
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error:', error)

      // Fallback to local processing if LLM is unavailable
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I'm having trouble connecting to my AI service right now. \n\nFor immediate assistance, please contact The House Team directly:\n\n📞 **Tabitha House**: (606) 224-3261\n📞 **Dustin House**: (606) 231-8571\n📧 **Email**: thouse@century21advantage.com\n\nOr visit us at:\n📍 911 N Main St, London, KY 40741`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition" title="Back to Home">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Home</span>
              </a>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center relative">
                  <Bot className="h-6 w-6 text-white" />
                  <Sparkles className="h-3 w-3 text-amber-200 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Kentucky Real Estate AI</h1>
                  <p className="text-xs text-slate-400">Powered by H200 • The House Team</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="tel:606-224-3261" className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">(606) 224-3261</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden min-h-[calc(100vh-200px)] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-blue-600'
                        : 'bg-gradient-to-br from-amber-400 to-amber-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>

                  {/* Property Cards */}
                  {message.properties && message.properties.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 ml-10">
                      {message.properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                    </div>
                  )}

                  <div className={`flex items-center gap-2 text-xs text-slate-500 mt-1 ${message.role === 'user' ? 'justify-end mr-10' : 'ml-10'}`}>
                    <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.model && (
                      <span className="text-amber-500/70">• {message.model.includes('120b') ? 'H200' : 'GPT-4o'}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-700 p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Kentucky real estate or search for properties..."
                className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2 text-center">
              The House Team - Century 21 Advantage Realty | London, KY | (606) 224-3261
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

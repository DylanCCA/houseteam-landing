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
  ArrowLeft
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  properties?: Property[]
  timestamp: Date
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

// Supabase configuration
const SUPABASE_URL = 'https://blfieqovcvzgiucuymen.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODM1MDcsImV4cCI6MjA2OTQ1OTUwN30.VbdUB8Gz-mNzb5BbsAWlHk_tYlgyt1sipUwUaCDxdDU'

// Sample Kentucky real estate knowledge for the bot
const KY_KNOWLEDGE = {
  laws: [
    "Kentucky sellers must complete a Seller's Disclosure of Property Condition form (KRS 324.360).",
    "Kentucky recognizes seller agency, buyer agency, dual agency (with written consent), and designated agency.",
    "Real estate agents in Kentucky must complete 96 hours of pre-licensing education and pass the state exam.",
    "Kentucky is an attorney state for closings - an attorney must be present at closing."
  ],
  contracts: [
    "A valid Kentucky real estate contract must include: identification of parties, property description, purchase price, earnest money terms, financing contingencies, inspection period (typically 10-14 days), closing date, and signatures.",
    "Earnest money in Kentucky is typically 1-3% of purchase price and must be deposited within 3 business days.",
    "The standard inspection period in Kentucky is 10-14 days from contract acceptance."
  ],
  negotiation: [
    "In Kentucky's market, effective negotiation includes understanding local comps, timing offers strategically, and being flexible on closing dates.",
    "When facing multiple offers, consider escalation clauses, appraisal gap coverage, and flexible closing timelines.",
    "Requesting seller concessions for repairs is common in Kentucky real estate transactions."
  ],
  process: [
    "Kentucky home buying steps: 1) Get pre-approved, 2) Find a REALTOR, 3) Search homes, 4) Make offer, 5) Inspection, 6) Appraisal, 7) Final walkthrough, 8) Closing.",
    "Typical timeline from contract to close in Kentucky is 30-45 days.",
    "Buyers typically pay 2-5% of purchase price in closing costs including lender fees, title insurance, and attorney fees."
  ]
}

// Parse user query to extract search criteria
function parseSearchCriteria(query: string): {
  city?: string
  minPrice?: number
  maxPrice?: number
  minBeds?: number
  minSqft?: number
  maxSqft?: number
} {
  const criteria: any = {}
  const lowerQuery = query.toLowerCase()
  
  // Extract city
  const kyLocations = ['london', 'corbin', 'lexington', 'louisville', 'richmond', 'berea', 'manchester', 'mckee', 'oneida', 'east bernstadt']
  for (const loc of kyLocations) {
    if (lowerQuery.includes(loc)) {
      criteria.city = loc.charAt(0).toUpperCase() + loc.slice(1)
      break
    }
  }
  
  // Extract price constraints
  const priceMatch = lowerQuery.match(/(?:under|below|less than|max|maximum)\s*\$?([\d,]+)/i)
  if (priceMatch) {
    criteria.maxPrice = parseInt(priceMatch[1].replace(/,/g, ''))
  }
  
  const minPriceMatch = lowerQuery.match(/(?:over|above|more than|min|minimum|at least)\s*\$?([\d,]+)/i)
  if (minPriceMatch) {
    criteria.minPrice = parseInt(minPriceMatch[1].replace(/,/g, ''))
  }
  
  // Extract bedrooms
  const bedMatch = lowerQuery.match(/(\d+)\s*(?:bed|bedroom|br)/i)
  if (bedMatch) {
    criteria.minBeds = parseInt(bedMatch[1])
  }
  
  // Extract square footage
  const sqftMatch = lowerQuery.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i)
  if (sqftMatch) {
    criteria.minSqft = parseInt(sqftMatch[1].replace(/,/g, ''))
  }
  
  return criteria
}

// Generate bot response based on query
async function generateResponse(query: string, properties: Property[]): Promise<string> {
  const lowerQuery = query.toLowerCase()
  
  // Check for knowledge-based questions
  if (lowerQuery.includes('law') || lowerQuery.includes('legal') || lowerQuery.includes('disclosure')) {
    return `Here's what you need to know about Kentucky real estate laws:\n\n${KY_KNOWLEDGE.laws.join('\n\n')}\n\nWould you like me to help you find properties or answer more questions?`
  }
  
  if (lowerQuery.includes('contract') || lowerQuery.includes('agreement') || lowerQuery.includes('earnest')) {
    return `Here's important information about Kentucky real estate contracts:\n\n${KY_KNOWLEDGE.contracts.join('\n\n')}\n\nNeed help with anything else?`
  }
  
  if (lowerQuery.includes('negotiat') || lowerQuery.includes('offer') || lowerQuery.includes('multiple')) {
    return `Here are some negotiation tips for Kentucky real estate:\n\n${KY_KNOWLEDGE.negotiation.join('\n\n')}\n\nWant me to search for properties?`
  }
  
  if (lowerQuery.includes('process') || lowerQuery.includes('steps') || lowerQuery.includes('how to buy') || lowerQuery.includes('closing')) {
    return `Here's the Kentucky home buying process:\n\n${KY_KNOWLEDGE.process.join('\n\n')}\n\nReady to start your home search?`
  }
  
  // Property search response
  if (properties.length > 0) {
    const criteria = parseSearchCriteria(query)
    let response = `I found ${properties.length} properties that match your criteria`
    if (criteria.city) response += ` in ${criteria.city}`
    if (criteria.maxPrice) response += ` under $${criteria.maxPrice.toLocaleString()}`
    if (criteria.minBeds) response += ` with ${criteria.minBeds}+ bedrooms`
    response += ':\n\n'
    response += 'Here are the listings I found. Click on any property to learn more or contact The House Team to schedule a showing!'
    return response
  }
  
  // Default response
  return `I'm The House Team's Kentucky Real Estate Assistant! I can help you:\n\n` +
    `- **Find Properties**: Tell me what you're looking for (e.g., "3 bedroom home in London under $300,000")\n` +
    `- **Kentucky Real Estate Laws**: Ask about disclosure requirements, agency relationships, etc.\n` +
    `- **Contract Information**: Learn about purchase agreements, earnest money, inspections\n` +
    `- **Negotiation Tips**: Get advice on making offers and negotiating deals\n` +
    `- **Buying Process**: Understand the steps from pre-approval to closing\n\n` +
    `How can I help you today?`
}

// Fetch properties from Supabase
async function searchProperties(criteria: any): Promise<Property[]> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/ky_property_listings?status=eq.Active&select=*`
    
    if (criteria.city) {
      url += `&city=ilike.${criteria.city}`
    }
    if (criteria.maxPrice) {
      url += `&price=lte.${criteria.maxPrice}`
    }
    if (criteria.minPrice) {
      url += `&price=gte.${criteria.minPrice}`
    }
    if (criteria.minBeds) {
      url += `&beds=gte.${criteria.minBeds}`
    }
    if (criteria.minSqft) {
      url += `&sqft=gte.${criteria.minSqft}`
    }
    
    url += '&limit=10&order=price.asc'
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (!response.ok) {
      console.error('Supabase error:', response.status)
      return []
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching properties:', error)
    return []
  }
}

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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">
            <Phone className="h-3 w-3 mr-1" /> Call
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs">
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
      content: `Welcome to The House Team's Kentucky Real Estate Assistant! I'm here to help you find your perfect home in Kentucky.\n\nI can help you:\n- Search for properties by location, price, bedrooms, and more\n- Answer questions about Kentucky real estate laws\n- Explain contracts and the buying process\n- Provide negotiation tips\n\nTry asking something like:\n- "Show me 3 bedroom homes in London under $300,000"\n- "What are Kentucky's disclosure requirements?"\n- "How does the home buying process work?"`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
    setInput('')
    setIsLoading(true)
    
    try {
      // Parse search criteria from user query
      const criteria = parseSearchCriteria(userMessage.content)
      
      // Search for properties if criteria found
      let properties: Property[] = []
      if (Object.keys(criteria).length > 0) {
        properties = await searchProperties(criteria)
      }
      
      // Generate response
      const responseText = await generateResponse(userMessage.content, properties)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        properties: properties.length > 0 ? properties : undefined,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact The House Team directly at (606) 224-3261.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
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
              <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                <ArrowLeft className="h-5 w-5" />
              </a>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Kentucky Real Estate Assistant</h1>
                  <p className="text-xs text-slate-400">Powered by The House Team</p>
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
                  
                  <p className={`text-xs text-slate-500 mt-1 ${message.role === 'user' ? 'text-right mr-10' : 'ml-10'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-slate-700 rounded-2xl px-4 py-3">
                    <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
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

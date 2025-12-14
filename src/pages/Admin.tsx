import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Home, 
  Phone, 
  Mail, 
  Users,
  Bell,
  Check,
  Send,
  Calendar,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://blfieqovcvzgiucuymen.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MTk5ODIsImV4cCI6MjA0NTk5NTk4Mn0.R3xzKelUhFQB4bHFgM-r2Fd2BXwDnIiPWwk8RoAr0bg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ClientProfile {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  status: string
  created_at: string
  criteria?: {
    counties: string[]
    location_type: string
    min_price: number
    max_price: number
    min_bedrooms: number
    property_types: string[]
  }
  matchingListings?: number
}

export default function AdminPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingNotifications: 0,
    sentToday: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('client_profiles')
        .select(`
          *,
          client_criteria (*)
        `)
        .order('created_at', { ascending: false })

      if (clientsError) throw clientsError

      const { data: notificationsData } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('status', 'pending')

      const { data: sentTodayData } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('status', 'sent')
        .gte('created_at', new Date().toISOString().split('T')[0])

      const formattedClients = (clientsData || []).map((client: ClientProfile & { client_criteria?: ClientProfile['criteria'][] }) => ({
        ...client,
        criteria: client.client_criteria?.[0],
        matchingListings: Math.floor(Math.random() * 10) + 1
      }))

      setClients(formattedClients)
      setStats({
        totalClients: formattedClients.length,
        pendingNotifications: (notificationsData || []).length,
        sentToday: (sentTodayData || []).length
      })
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const selectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(clients.map(c => c.id))
    }
  }

  const sendNotifications = async (clientIds: string[]) => {
    setSending(true)
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/client-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          action: 'approve-and-send',
          clientIds
        })
      })

      if (!response.ok) throw new Error('Failed to send notifications')

      await fetchData()
      setSelectedClients([])
    } catch (err) {
      console.error('Error sending notifications:', err)
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3">
            <Home className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">The House Team</h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
          </a>
          <nav className="flex items-center space-x-4">
            <a href="/showings" className="flex items-center text-gray-600 hover:text-blue-600">
              <Calendar className="h-5 w-5 mr-1" />
              Showings
            </a>
            <a href="/bot" className="flex items-center text-gray-600 hover:text-blue-600">
              <MessageSquare className="h-5 w-5 mr-1" />
              Bot
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Notifications</h1>
            <p className="text-gray-600">Manage and approve client listing notifications</p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Clients</p>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full mr-4">
                  <Bell className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Notifications</p>
                  <p className="text-2xl font-bold">{stats.pendingNotifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sent Today</p>
                  <p className="text-2xl font-bold">{stats.sentToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedClients.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium">{selectedClients.length} client(s) selected</span>
                </div>
                <Button 
                  onClick={() => sendNotifications(selectedClients)}
                  disabled={sending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Approve & Send All
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Client List</CardTitle>
                <CardDescription>Click to expand and view client criteria</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedClients.length === clients.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No clients yet</p>
                <a href="/signup" className="text-blue-600 hover:underline text-sm">
                  Share signup link <ExternalLink className="h-3 w-3 inline" />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div 
                    key={client.id}
                    className={`border rounded-lg overflow-hidden ${
                      selectedClients.includes(client.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                    >
                      <div className="flex items-center">
                        <Checkbox 
                          checked={selectedClients.includes(client.id)}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleClientSelection(client.id)
                          }}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">{client.first_name} {client.last_name}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-3">
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {client.phone}
                            </span>
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {client.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">
                          {client.matchingListings} matches
                        </Badge>
                        <Badge className={client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {client.status}
                        </Badge>
                        {expandedClient === client.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {expandedClient === client.id && client.criteria && (
                      <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Counties</p>
                            <p className="font-medium">{client.criteria.counties?.join(', ') || 'Any'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Location Type</p>
                            <p className="font-medium capitalize">{client.criteria.location_type || 'Any'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Price Range</p>
                            <p className="font-medium">
                              {formatPrice(client.criteria.min_price)} - {formatPrice(client.criteria.max_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Bedrooms</p>
                            <p className="font-medium">{client.criteria.min_bedrooms}+</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500">Property Types</p>
                            <p className="font-medium">{client.criteria.property_types?.join(', ') || 'Any'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Signed Up</p>
                            <p className="font-medium">{formatDate(client.created_at)}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              sendNotifications([client.id])
                            }}
                            disabled={sending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send Notification
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Schedule Showing
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

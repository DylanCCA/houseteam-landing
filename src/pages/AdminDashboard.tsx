import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Send,
  CheckCircle,
  Users,
  Home,
  Calendar,
  Phone,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react'

// Supabase configuration
const SUPABASE_URL = 'https://blfieqovcvzgiucuymen.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODM1MDcsImV4cCI6MjA2OTQ1OTUwN30.VbdUB8Gz-mNzb5BbsAWlHk_tYlgyt1sipUwUaCDxdDU'
const NOTIFICATION_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/client-notifications`

interface ClientNotification {
  client_name: string
  client_phone: string
  client_id: string
  criteria_name: string
  new_listings_count: number
  listing_addresses: string[]
}

interface Stats {
  totalClients: number
  pendingNotifications: number
  sentToday: number
  responsesReceived: number
}

export default function AdminDashboard() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    pendingNotifications: 0,
    sentToday: 0,
    responsesReceived: 0
  })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${NOTIFICATION_FUNCTION_URL}?action=summary`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data || [])
        setStats({
          totalClients: data.data?.length || 0,
          pendingNotifications: data.data?.reduce((sum: number, c: ClientNotification) => sum + c.new_listings_count, 0) || 0,
          sentToday: 0, // Would need separate query
          responsesReceived: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggleExpand = (clientId: string) => {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId)
    } else {
      newExpanded.add(clientId)
    }
    setExpandedClients(newExpanded)
  }

  const toggleSelect = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

  const selectAll = () => {
    if (selectedClients.size === notifications.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(notifications.map(n => n.client_id)))
    }
  }

  const approveAndSend = async (clientIds?: string[]) => {
    setSending(true)
    try {
      // If specific clients, approve them first
      if (clientIds && clientIds.length > 0) {
        for (const clientId of clientIds) {
          await fetch(`${NOTIFICATION_FUNCTION_URL}?action=approve`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clientId })
          })
        }
      } else {
        // Approve all
        await fetch(`${NOTIFICATION_FUNCTION_URL}?action=approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ batchId: 'all' })
        })
      }

      // Send approved notifications
      const sendResponse = await fetch(`${NOTIFICATION_FUNCTION_URL}?action=send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await sendResponse.json()

      if (result.success) {
        alert(`✅ Sent! ${result.sms_sent} SMS, ${result.emails_sent} emails`)
        setSelectedClients(new Set())
        fetchNotifications()
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send notifications')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-slate-400 hover:text-white" title="Back to home">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to home</span>
              </a>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-slate-400">Client Notifications & Showing Scheduler</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotifications}
                disabled={loading}
                className="text-slate-300 border-slate-600"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <a href="/showings" className="text-blue-400 hover:text-blue-300 text-sm mr-3">
                <Calendar className="h-4 w-4 inline mr-1" />
                Showings
              </a>
              <a href="/bot" className="text-amber-400 hover:text-amber-300 text-sm">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Bot
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
                  <p className="text-xs text-slate-400">Active Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Bell className="h-8 w-8 text-amber-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.pendingNotifications}</p>
                  <p className="text-xs text-slate-400">Pending Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.sentToday}</p>
                  <p className="text-xs text-slate-400">Sent Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.responsesReceived}</p>
                  <p className="text-xs text-slate-400">Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Home className="h-5 w-5 text-amber-400" />
                New Listing Notifications
              </CardTitle>
              <div className="flex gap-2">
                {selectedClients.size > 0 && (
                  <Button
                    onClick={() => approveAndSend(Array.from(selectedClients))}
                    disabled={sending}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send to {selectedClients.size} Selected
                  </Button>
                )}
                <Button
                  onClick={() => approveAndSend()}
                  disabled={sending || notifications.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {sending ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Approve & Send All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <p className="text-slate-300">All caught up!</p>
                <p className="text-slate-500 text-sm">No pending notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="flex items-center gap-3 py-2 px-3 bg-slate-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedClients.size === notifications.length}
                    onChange={selectAll}
                    className="rounded border-slate-500"
                    aria-label="Select all clients"
                    title="Select all clients"
                  />
                  <span className="text-slate-300 text-sm font-medium">
                    Select All ({notifications.length} clients)
                  </span>
                </div>

                {/* Client List */}
                {notifications.map((notification) => (
                  <div
                    key={notification.client_id}
                    className="border border-slate-700 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-3 p-3 bg-slate-700/30 cursor-pointer hover:bg-slate-700/50"
                      onClick={() => toggleExpand(notification.client_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClients.has(notification.client_id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelect(notification.client_id)
                        }}
                        className="rounded border-slate-500"
                        aria-label={`Select ${notification.client_name}`}
                        title={`Select ${notification.client_name}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{notification.client_name}</span>
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                            {notification.new_listings_count} new
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {notification.client_phone}
                          </span>
                          <span className="text-slate-500">|</span>
                          <span>{notification.criteria_name || 'Default Search'}</span>
                        </div>
                      </div>
                      {expandedClients.has(notification.client_id) ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    {expandedClients.has(notification.client_id) && (
                      <div className="p-3 bg-slate-800/50 border-t border-slate-700">
                        <p className="text-xs text-slate-500 mb-2">Matching Listings:</p>
                        <ul className="space-y-1">
                          {notification.listing_addresses.map((address, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                              <Home className="h-3 w-3 text-slate-500" />
                              {address}
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-slate-300 border-slate-600"
                            onClick={() => window.location.href = `tel:${notification.client_phone}`}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              approveAndSend([notification.client_id])
                            }}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send Now
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

        {/* Scheduled Showings Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Upcoming Showings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No showings scheduled</p>
              <p className="text-slate-500 text-sm">Client responses will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

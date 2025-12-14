import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Clock,
  Home,
  User,
  Phone,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Car,
  AlertCircle
} from 'lucide-react'

// Supabase configuration
const SUPABASE_URL = 'https://blfieqovcvzgiucuymen.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODM1MDcsImV4cCI6MjA2OTQ1OTUwN30.VbdUB8Gz-mNzb5BbsAWlHk_tYlgyt1sipUwUaCDxdDU'

// Kentucky area groupings for efficient showing routes
const AREA_GROUPS = {
  'laurel-north': { name: 'Laurel County (North)', counties: ['Laurel'], cities: ['London', 'East Bernstadt'] },
  'laurel-south': { name: 'Laurel County (South)', counties: ['Laurel'], cities: ['Corbin', 'Lily'] },
  'knox': { name: 'Knox County', counties: ['Knox'], cities: ['Barbourville', 'Corbin'] },
  'clay': { name: 'Clay County', counties: ['Clay'], cities: ['Manchester'] },
  'whitley': { name: 'Whitley County', counties: ['Whitley'], cities: ['Williamsburg', 'Corbin'] },
  'pulaski': { name: 'Pulaski County', counties: ['Pulaski'], cities: ['Somerset', 'Science Hill'] },
  'rockcastle': { name: 'Rockcastle County', counties: ['Rockcastle'], cities: ['Mount Vernon', 'Brodhead'] },
  'madison': { name: 'Madison County', counties: ['Madison'], cities: ['Richmond', 'Berea'] }
}

// Time slots for showings
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
]

interface ScheduledShowing {
  id: string
  client_id: string
  listing_id?: string
  listing_address: string
  listing_city?: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  client_confirmed: boolean
  client?: {
    first_name: string
    last_name: string
    phone: string
    email?: string
  }
}

export default function ShowingScheduler() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showings, setShowings] = useState<ScheduledShowing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showNewShowingForm, setShowNewShowingForm] = useState(false)
  const [newShowing, setNewShowing] = useState({
    clientName: '',
    clientPhone: '',
    listingAddress: '',
    listingCity: '',
    date: '',
    time: '10:00'
  })

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const fetchShowings = async () => {
    setLoading(true)
    try {
      // Get showings for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/scheduled_showings?scheduled_date=gte.${formatDate(startDate)}&scheduled_date=lte.${formatDate(endDate)}&select=*,client_profiles(first_name,last_name,phone,email)&order=scheduled_date,scheduled_time`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setShowings(data.map((s: any) => ({
          ...s,
          client: s.client_profiles
        })))
      }
    } catch (error) {
      console.error('Failed to fetch showings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShowings()
  }, [currentDate])

  const getShowingsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return showings.filter(s => s.scheduled_date === dateStr)
  }

  const getAreaForCity = (city: string) => {
    for (const [key, area] of Object.entries(AREA_GROUPS)) {
      if (area.cities.some(c => city.toLowerCase().includes(c.toLowerCase()))) {
        return { key, ...area }
      }
    }
    return null
  }

  // Group showings by area for efficient routing
  const getGroupedShowings = (dateShowings: ScheduledShowing[]) => {
    const grouped: Record<string, ScheduledShowing[]> = {}

    for (const showing of dateShowings) {
      const area = getAreaForCity(showing.listing_city || '') || { key: 'other', name: 'Other Areas' }
      if (!grouped[area.key]) {
        grouped[area.key] = []
      }
      grouped[area.key].push(showing)
    }

    // Sort each group by time
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
    }

    return grouped
  }

  const scheduleShowing = async () => {
    if (!newShowing.clientName || !newShowing.clientPhone || !newShowing.listingAddress || !newShowing.date) {
      return
    }

    try {
      // First create or find client
      const clientResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/client_profiles?phone=eq.${encodeURIComponent(newShowing.clientPhone)}&select=id`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      )

      let clientId: string

      if (clientResponse.ok) {
        const clients = await clientResponse.json()
        if (clients.length > 0) {
          clientId = clients[0].id
        } else {
          // Create new client
          const names = newShowing.clientName.split(' ')
          const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/client_profiles`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              first_name: names[0] || '',
              last_name: names.slice(1).join(' ') || '',
              phone: newShowing.clientPhone,
              status: 'active',
              source: 'manual'
            })
          })

          if (createResponse.ok) {
            const [newClient] = await createResponse.json()
            clientId = newClient.id
          } else {
            throw new Error('Failed to create client')
          }
        }
      } else {
        throw new Error('Failed to check for existing client')
      }

      // Create the showing
      const showingResponse = await fetch(`${SUPABASE_URL}/rest/v1/scheduled_showings`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          listing_address: newShowing.listingAddress,
          listing_city: newShowing.listingCity,
          scheduled_date: newShowing.date,
          scheduled_time: newShowing.time,
          duration_minutes: 30,
          status: 'pending'
        })
      })

      if (showingResponse.ok) {
        setShowNewShowingForm(false)
        setNewShowing({
          clientName: '',
          clientPhone: '',
          listingAddress: '',
          listingCity: '',
          date: '',
          time: '10:00'
        })
        fetchShowings()
      }
    } catch (error) {
      console.error('Failed to schedule showing:', error)
    }
  }

  const updateShowingStatus = async (showingId: string, status: string) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/scheduled_showings?id=eq.${showingId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      })
      fetchShowings()
    } catch (error) {
      console.error('Failed to update showing:', error)
    }
  }

  const confirmShowing = async (showingId: string) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/scheduled_showings?id=eq.${showingId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'confirmed',
          client_confirmed: true,
          client_confirmed_at: new Date().toISOString()
        })
      })
      fetchShowings()
    } catch (error) {
      console.error('Failed to confirm showing:', error)
    }
  }

  const selectedDateShowings = selectedDate
    ? showings.filter(s => s.scheduled_date === selectedDate)
    : []
  const groupedShowings = getGroupedShowings(selectedDateShowings)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/admin" className="text-slate-400 hover:text-white" title="Back to admin">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to admin</span>
              </a>
              <div>
                <h1 className="text-xl font-bold text-white">Showing Scheduler</h1>
                <p className="text-xs text-slate-400">Area-Optimized Routes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchShowings}
                disabled={loading}
                className="text-slate-300 border-slate-600"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowNewShowingForm(true)}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Calendar className="h-4 w-4 mr-1" />
                New Showing
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="md:col-span-2 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-400" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((day, i) => {
                  if (!day) {
                    return <div key={i} className="h-24" />
                  }

                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayShowings = getShowingsForDate(day)
                  const isToday = dateStr === formatDate(new Date())
                  const isSelected = dateStr === selectedDate
                  const isPast = new Date(dateStr) < new Date(formatDate(new Date()))

                  return (
                    <div
                      key={i}
                      className={`h-24 p-1 border rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10'
                          : isToday
                          ? 'border-blue-500 bg-blue-500/10'
                          : isPast
                          ? 'border-slate-700/50 bg-slate-800/30 opacity-50'
                          : 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50'
                      }`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                        {day}
                      </div>
                      {dayShowings.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {dayShowings.slice(0, 2).map(showing => (
                            <div
                              key={showing.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                showing.status === 'confirmed'
                                  ? 'bg-green-500/20 text-green-400'
                                  : showing.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {showing.scheduled_time.slice(0, 5)}
                            </div>
                          ))}
                          {dayShowings.length > 2 && (
                            <div className="text-xs text-slate-500">+{dayShowings.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Select a Day'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">Click a date to view showings</p>
                </div>
              ) : selectedDateShowings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <p className="text-slate-300">No showings scheduled</p>
                  <Button
                    size="sm"
                    className="mt-3 bg-amber-500 hover:bg-amber-600"
                    onClick={() => {
                      setNewShowing(prev => ({ ...prev, date: selectedDate }))
                      setShowNewShowingForm(true)
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Add Showing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Area-grouped showings with route optimization hint */}
                  {Object.entries(groupedShowings).map(([areaKey, areaShowings]) => {
                    const area = AREA_GROUPS[areaKey as keyof typeof AREA_GROUPS] || { name: 'Other Areas' }
                    return (
                      <div key={areaKey} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Car className="h-4 w-4" />
                          <span>{area.name}</span>
                          <Badge variant="outline" className="text-xs border-slate-600">
                            {areaShowings.length} showing{areaShowings.length > 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {areaShowings.map(showing => (
                          <div
                            key={showing.id}
                            className={`p-3 rounded-lg border ${
                              showing.status === 'confirmed'
                                ? 'bg-green-500/10 border-green-500/30'
                                : showing.status === 'cancelled'
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-slate-700/50 border-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-slate-400" />
                                  <span className="text-white font-medium">
                                    {showing.scheduled_time.slice(0, 5)}
                                  </span>
                                  <Badge
                                    className={`text-xs ${
                                      showing.status === 'confirmed'
                                        ? 'bg-green-500/20 text-green-400'
                                        : showing.status === 'cancelled'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {showing.status}
                                  </Badge>
                                </div>
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Home className="h-3 w-3" />
                                    {showing.listing_address}
                                  </div>
                                  {showing.client && (
                                    <>
                                      <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <User className="h-3 w-3" />
                                        {showing.client.first_name} {showing.client.last_name}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Phone className="h-3 w-3" />
                                        <a href={`tel:${showing.client.phone}`} className="hover:text-white">
                                          {showing.client.phone}
                                        </a>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {showing.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => confirmShowing(showing.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                                  onClick={() => updateShowingStatus(showing.id, 'cancelled')}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            )}

                            {showing.status === 'confirmed' && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => updateShowingStatus(showing.id, 'completed')}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-amber-400 border-amber-400/50 hover:bg-amber-500/10"
                                  onClick={() => updateShowingStatus(showing.id, 'no_show')}
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  No Show
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}

                  {/* Route optimization tip */}
                  {Object.keys(groupedShowings).length > 1 && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Car className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-300 text-sm font-medium">Route Tip</p>
                          <p className="text-slate-400 text-xs">
                            Showings are grouped by area. Consider scheduling adjacent areas together to minimize drive time.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Showing Modal */}
        {showNewShowingForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Schedule New Showing</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewShowingForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Client Name *</label>
                  <Input
                    value={newShowing.clientName}
                    onChange={(e) => setNewShowing({ ...newShowing, clientName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Phone *</label>
                  <Input
                    type="tel"
                    value={newShowing.clientPhone}
                    onChange={(e) => setNewShowing({ ...newShowing, clientPhone: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="(606) 555-1234"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Property Address *</label>
                  <Input
                    value={newShowing.listingAddress}
                    onChange={(e) => setNewShowing({ ...newShowing, listingAddress: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-1 block">City *</label>
                  <Input
                    value={newShowing.listingCity}
                    onChange={(e) => setNewShowing({ ...newShowing, listingCity: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="London"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-1 block">Date *</label>
                    <Input
                      type="date"
                      value={newShowing.date}
                      onChange={(e) => setNewShowing({ ...newShowing, date: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      min={formatDate(new Date())}
                    />
                  </div>
                  <div>
                    <label htmlFor="showing-time" className="text-sm text-slate-300 mb-1 block">Time *</label>
                    <select
                      id="showing-time"
                      value={newShowing.time}
                      onChange={(e) => setNewShowing({ ...newShowing, time: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-slate-700 border border-slate-600 text-white"
                      title="Select showing time"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>
                          {slot.replace(':00', ':00 AM').replace(':30', ':30 AM')
                            .replace('13:', '1:').replace('14:', '2:').replace('15:', '3:')
                            .replace('16:', '4:').replace('17:', '5:')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewShowingForm(false)}
                    className="text-slate-300 border-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={scheduleShowing}
                    disabled={!newShowing.clientName || !newShowing.clientPhone || !newShowing.listingAddress || !newShowing.date}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

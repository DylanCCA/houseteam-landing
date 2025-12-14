import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Home, 
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  Users
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://blfieqovcvzgiucuymen.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODM1MDcsImV4cCI6MjA2OTQ1OTUwN30.VbdUB8Gz-mNzb5BbsAWlHk_tYlgyt1sipUwUaCDxdDU'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Showing {
  id: string
  client_id: string
  listing_address: string
  area: string
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  notes: string
  client?: {
    first_name: string
    last_name: string
    phone: string
  }
}

const areas = [
  { id: 'laurel-north', name: 'Laurel North', color: 'bg-blue-500' },
  { id: 'laurel-south', name: 'Laurel South', color: 'bg-blue-400' },
  { id: 'knox', name: 'Knox County', color: 'bg-green-500' },
  { id: 'clay', name: 'Clay County', color: 'bg-yellow-500' },
  { id: 'whitley', name: 'Whitley County', color: 'bg-purple-500' },
  { id: 'pulaski', name: 'Pulaski County', color: 'bg-red-500' },
  { id: 'rockcastle', name: 'Rockcastle County', color: 'bg-orange-500' },
  { id: 'madison', name: 'Madison County', color: 'bg-pink-500' }
]

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'
]

export default function ShowingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showings, setShowings] = useState<Showing[]>([])
  const [, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string; phone: string }>>([])
  
  const [newShowing, setNewShowing] = useState({
    client_id: '',
    listing_address: '',
    area: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
  })

  useEffect(() => {
    fetchShowings()
    fetchClients()
  }, [currentDate])

  const fetchShowings = async () => {
    setLoading(true)
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('scheduled_showings')
        .select(`
          *,
          client:client_profiles (first_name, last_name, phone)
        `)
        .gte('scheduled_date', startOfMonth.toISOString().split('T')[0])
        .lte('scheduled_date', endOfMonth.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })

      if (error) throw error
      setShowings(data || [])
    } catch (err) {
      console.error('Error fetching showings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data } = await supabase
        .from('client_profiles')
        .select('id, first_name, last_name, phone')
        .eq('status', 'active')
        .order('last_name', { ascending: true })
      
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const createShowing = async () => {
    try {
      const { error } = await supabase
        .from('scheduled_showings')
        .insert({
          ...newShowing,
          status: 'scheduled'
        })

      if (error) throw error

      setShowNewForm(false)
      setNewShowing({
        client_id: '',
        listing_address: '',
        area: '',
        scheduled_date: '',
        scheduled_time: '',
        notes: ''
      })
      fetchShowings()
    } catch (err) {
      console.error('Error creating showing:', err)
    }
  }

  const updateShowingStatus = async (id: string, status: Showing['status']) => {
    try {
      const { error } = await supabase
        .from('scheduled_showings')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      fetchShowings()
    } catch (err) {
      console.error('Error updating showing:', err)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getShowingsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return showings.filter(s => s.scheduled_date === dateStr)
  }

  const getAreaColor = (areaId: string) => {
    return areas.find(a => a.id === areaId)?.color || 'bg-gray-500'
  }

  const getStatusBadge = (status: Showing['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-yellow-100 text-yellow-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const todayShowings = showings.filter(s => {
    const today = new Date().toISOString().split('T')[0]
    return s.scheduled_date === today
  })

  const areasToday = [...new Set(todayShowings.map(s => s.area))]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3">
            <Home className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">The House Team</h1>
              <p className="text-sm text-gray-500">Showing Scheduler</p>
            </div>
          </a>
          <nav className="flex items-center space-x-4">
            <a href="/admin" className="flex items-center text-gray-600 hover:text-blue-600">
              <Users className="h-5 w-5 mr-1" />
              Admin
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
            <h1 className="text-2xl font-bold text-gray-900">Showing Schedule</h1>
            <p className="text-gray-600">Manage property showings and appointments</p>
          </div>
          <Button onClick={() => setShowNewForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Showing
          </Button>
        </div>

        {areasToday.length > 1 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Route Optimization Tip</p>
                  <p className="text-sm text-yellow-700">
                    You have showings in {areasToday.length} different areas today. Consider grouping by area for efficient routing:
                    {areasToday.map(a => areas.find(ar => ar.id === a)?.name).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{monthName}</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth().map((day, index) => {
                    const dayShowings = day ? getShowingsForDay(day) : []
                    const isToday = day === new Date().getDate() && 
                      currentDate.getMonth() === new Date().getMonth() &&
                      currentDate.getFullYear() === new Date().getFullYear()
                    
                    return (
                      <div 
                        key={index}
                        className={`min-h-24 p-1 border rounded ${
                          day ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                              {day}
                            </div>
                            <div className="space-y-1">
                              {dayShowings.slice(0, 3).map(showing => (
                                <div 
                                  key={showing.id}
                                  className={`text-xs p-1 rounded truncate ${getAreaColor(showing.area)} text-white`}
                                  title={`${showing.scheduled_time} - ${showing.listing_address}`}
                                >
                                  {showing.scheduled_time}
                                </div>
                              ))}
                              {dayShowings.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{dayShowings.length - 3} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Today's Showings
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayShowings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No showings scheduled for today</p>
                ) : (
                  <div className="space-y-3">
                    {todayShowings.map(showing => (
                      <div key={showing.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="font-medium">{showing.scheduled_time}</span>
                          </div>
                          <Badge className={getStatusBadge(showing.status)}>
                            {showing.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {showing.listing_address}
                          </div>
                          {showing.client && (
                            <div className="flex items-center text-gray-600">
                              <User className="h-3 w-3 mr-1" />
                              {showing.client.first_name} {showing.client.last_name}
                            </div>
                          )}
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${getAreaColor(showing.area)} mr-1`} />
                            <span className="text-xs text-gray-500">
                              {areas.find(a => a.id === showing.area)?.name}
                            </span>
                          </div>
                        </div>
                        {showing.status === 'scheduled' && (
                          <div className="flex space-x-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                              onClick={() => updateShowingStatus(showing.id, 'confirmed')}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 text-red-600 hover:text-red-700"
                              onClick={() => updateShowingStatus(showing.id, 'cancelled')}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                        {showing.status === 'confirmed' && (
                          <div className="flex space-x-2 mt-3">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => updateShowingStatus(showing.id, 'completed')}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 text-yellow-600"
                              onClick={() => updateShowingStatus(showing.id, 'no-show')}
                            >
                              No-Show
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Area Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {areas.map(area => (
                    <div key={area.id} className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded ${area.color} mr-2`} />
                      {area.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Schedule New Showing</CardTitle>
                <CardDescription>Enter the showing details below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newShowing.client_id}
                    onChange={(e) => setNewShowing(prev => ({ ...prev, client_id: e.target.value }))}
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} - {client.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                  <Input
                    value={newShowing.listing_address}
                    onChange={(e) => setNewShowing(prev => ({ ...prev, listing_address: e.target.value }))}
                    placeholder="123 Main St, London, KY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={newShowing.area}
                    onChange={(e) => setNewShowing(prev => ({ ...prev, area: e.target.value }))}
                  >
                    <option value="">Select area...</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <Input
                      type="date"
                      value={newShowing.scheduled_date}
                      onChange={(e) => setNewShowing(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newShowing.scheduled_time}
                      onChange={(e) => setNewShowing(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    >
                      <option value="">Select time...</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    className="w-full p-2 border rounded-lg resize-none"
                    rows={2}
                    value={newShowing.notes}
                    onChange={(e) => setNewShowing(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions..."
                  />
                </div>
                <div className="flex space-x-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowNewForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={createShowing}
                    disabled={!newShowing.client_id || !newShowing.listing_address || !newShowing.scheduled_date || !newShowing.scheduled_time}
                  >
                    Schedule Showing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

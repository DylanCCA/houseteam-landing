import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  MapPin,
  DollarSign,
  Bed,
  Trees,
  Building2,
  Phone,
  Mail,
  User,
  Bell,
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

// Supabase configuration
const SUPABASE_URL = 'https://blfieqovcvzgiucuymen.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODM1MDcsImV4cCI6MjA2OTQ1OTUwN30.VbdUB8Gz-mNzb5BbsAWlHk_tYlgyt1sipUwUaCDxdDU'

// Kentucky Counties (for dropdown)
const KY_COUNTIES = [
  'Laurel', 'Knox', 'Clay', 'Jackson', 'Whitley', 'Bell', 'Harlan',
  'Pulaski', 'Rockcastle', 'Madison', 'Fayette', 'Jefferson', 'Kenton'
]

// Property Types
const PROPERTY_TYPES = [
  { value: 'SF', label: 'Single Family Home', icon: Home },
  { value: 'FA', label: 'Farm/Ranch', icon: Trees },
  { value: 'UL', label: 'Land/Lots', icon: MapPin },
  { value: 'MF', label: 'Multi-Family', icon: Building2 },
  { value: 'CO', label: 'Condo/Townhouse', icon: Building2 }
]

// Price Ranges
const PRICE_RANGES = [
  { min: 0, max: 100000, label: 'Under $100K' },
  { min: 100000, max: 200000, label: '$100K - $200K' },
  { min: 200000, max: 300000, label: '$200K - $300K' },
  { min: 300000, max: 500000, label: '$300K - $500K' },
  { min: 500000, max: 1000000, label: '$500K - $1M' },
  { min: 1000000, max: 999999999, label: '$1M+' }
]

// Acreage Ranges
const ACREAGE_RANGES = [
  { value: '0-1', label: '0-1 acres', min: 0, max: 1 },
  { value: '1-5', label: '1-5 acres', min: 1, max: 5 },
  { value: '5-10', label: '5-10 acres', min: 5, max: 10 },
  { value: '10-50', label: '10-50 acres', min: 10, max: 50 },
  { value: '50+', label: '50+ acres', min: 50, max: 99999 }
]

// Bedroom Options
const BEDROOM_OPTIONS = [1, 2, 3, 4, 5]

interface FormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  counties: string[]
  locationTypes: string[]
  priceRange: { min: number; max: number } | null
  minBeds: number | null
  propertyTypes: string[]
  acreageRange: string | null
  notifySms: boolean
  notifyEmail: boolean
}

export default function ClientSignup() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    counties: [],
    locationTypes: [],
    priceRange: null,
    minBeds: null,
    propertyTypes: [],
    acreageRange: null,
    notifySms: true,
    notifyEmail: true
  })

  const toggleCounty = (county: string) => {
    setFormData(prev => ({
      ...prev,
      counties: prev.counties.includes(county)
        ? prev.counties.filter(c => c !== county)
        : [...prev.counties, county]
    }))
  }

  const togglePropertyType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }))
  }

  const toggleLocationType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      locationTypes: prev.locationTypes.includes(type)
        ? prev.locationTypes.filter(t => t !== type)
        : [...prev.locationTypes, type]
    }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    try {
      // Create client profile
      const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/client_profiles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          email: formData.email || null,
          notify_sms: formData.notifySms,
          notify_email: formData.notifyEmail,
          status: 'active',
          source: 'website'
        })
      })

      if (!profileResponse.ok) {
        const err = await profileResponse.text()
        throw new Error(err)
      }

      const [profile] = await profileResponse.json()

      // Create search criteria
      const criteriaResponse = await fetch(`${SUPABASE_URL}/rest/v1/client_criteria`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: profile.id,
          name: 'My Home Search',
          counties: formData.counties.length > 0 ? formData.counties : null,
          min_price: formData.priceRange?.min || null,
          max_price: formData.priceRange?.max || null,
          min_beds: formData.minBeds,
          property_types: formData.propertyTypes.length > 0 ? formData.propertyTypes : null,
          acreage_range: formData.acreageRange,
          min_acres: formData.acreageRange ? ACREAGE_RANGES.find(r => r.value === formData.acreageRange)?.min : null,
          max_acres: formData.acreageRange ? ACREAGE_RANGES.find(r => r.value === formData.acreageRange)?.max : null,
          is_active: true
        })
      })

      if (!criteriaResponse.ok) {
        console.error('Failed to create criteria:', await criteriaResponse.text())
        // Don't fail - profile was created
      }

      setSuccess(true)
    } catch (err) {
      console.error('Signup error:', err)
      setError('Failed to sign up. Please try again or call (606) 224-3261.')
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.phone
      case 2:
        return formData.counties.length > 0
      case 3:
        return formData.priceRange !== null
      case 4:
        return true // Property types optional
      default:
        return true
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
            <p className="text-slate-300 mb-4">
              We'll notify you when new listings match your criteria.
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Tabitha or Dustin will reach out if we find the perfect home for you!
            </p>
            <div className="flex flex-col gap-2">
              <a href="/bot">
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  Chat with Our AI Assistant
                </Button>
              </a>
              <a href="/">
                <Button variant="outline" className="w-full text-slate-300 border-slate-600">
                  Back to Home
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <a href="/" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-xl font-bold text-white">Get Listing Alerts</h1>
              <p className="text-xs text-slate-400">The House Team • Century 21</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-amber-500' : 'bg-slate-700'}`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">Step {step} of 5</p>
      </div>

      {/* Form Steps */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Step 1: Contact Info */}
        {step === 1 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-amber-400" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">First Name *</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Last Name *</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  <Phone className="h-3 w-3 inline mr-1" />
                  Phone Number * <span className="text-slate-500">(for text alerts)</span>
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="(606) 555-1234"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  <Mail className="h-3 w-3 inline mr-1" />
                  Email <span className="text-slate-500">(optional)</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="john@example.com"
                />
              </div>

              <div className="pt-2">
                <p className="text-sm text-slate-300 mb-2">How would you like to be notified?</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.notifySms}
                      onChange={(e) => setFormData({ ...formData, notifySms: e.target.checked })}
                      className="rounded border-slate-500"
                    />
                    Text Message
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.notifyEmail}
                      onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
                      className="rounded border-slate-500"
                    />
                    Email
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-400" />
                Where are you looking?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">Select one or more counties:</p>
              <div className="flex flex-wrap gap-2">
                {KY_COUNTIES.map((county) => (
                  <Badge
                    key={county}
                    variant={formData.counties.includes(county) ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 py-2 ${
                      formData.counties.includes(county)
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => toggleCounty(county)}
                  >
                    {county}
                  </Badge>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-slate-400 text-sm mb-3">Location preference:</p>
                <div className="flex flex-wrap gap-2">
                  {['City', 'Suburbs', 'Rural'].map((type) => (
                    <Badge
                      key={type}
                      variant={formData.locationTypes.includes(type) ? 'default' : 'outline'}
                      className={`cursor-pointer px-3 py-2 ${
                        formData.locationTypes.includes(type)
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      }`}
                      onClick={() => toggleLocationType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Price Range */}
        {step === 3 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-400" />
                What's your budget?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {PRICE_RANGES.map((range) => (
                  <div
                    key={range.label}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      formData.priceRange?.min === range.min
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => setFormData({ ...formData, priceRange: range })}
                  >
                    <span className="font-medium">{range.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Property Details */}
        {step === 4 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Home className="h-5 w-5 text-amber-400" />
                What are you looking for?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Types */}
              <div>
                <p className="text-slate-300 text-sm mb-3">Property Type:</p>
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.value}
                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 ${
                          formData.propertyTypes.includes(type.value)
                            ? 'bg-amber-500/20 border-amber-500 text-white'
                            : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                        }`}
                        onClick={() => togglePropertyType(type.value)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{type.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <p className="text-slate-300 text-sm mb-3">
                  <Bed className="h-4 w-4 inline mr-1" />
                  Minimum Bedrooms:
                </p>
                <div className="flex gap-2">
                  {BEDROOM_OPTIONS.map((beds) => (
                    <div
                      key={beds}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center cursor-pointer ${
                        formData.minBeds === beds
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                      }`}
                      onClick={() => setFormData({ ...formData, minBeds: formData.minBeds === beds ? null : beds })}
                    >
                      {beds}+
                    </div>
                  ))}
                </div>
              </div>

              {/* Acreage */}
              <div>
                <p className="text-slate-300 text-sm mb-3">
                  <Trees className="h-4 w-4 inline mr-1" />
                  Land/Acreage:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACREAGE_RANGES.map((range) => (
                    <Badge
                      key={range.value}
                      variant={formData.acreageRange === range.value ? 'default' : 'outline'}
                      className={`cursor-pointer px-3 py-2 ${
                        formData.acreageRange === range.value
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      }`}
                      onClick={() => setFormData({
                        ...formData,
                        acreageRange: formData.acreageRange === range.value ? null : range.value
                      })}
                    >
                      {range.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-400" />
                Review Your Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="text-white">{formData.phone}</span>
                </div>
                {formData.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white">{formData.email}</span>
                  </div>
                )}
                <hr className="border-slate-600" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Counties:</span>
                  <span className="text-white">{formData.counties.join(', ') || 'Any'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Range:</span>
                  <span className="text-white">
                    {formData.priceRange
                      ? `$${formData.priceRange.min.toLocaleString()} - $${formData.priceRange.max.toLocaleString()}`
                      : 'Any'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bedrooms:</span>
                  <span className="text-white">{formData.minBeds ? `${formData.minBeds}+` : 'Any'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Property Types:</span>
                  <span className="text-white">
                    {formData.propertyTypes.length > 0
                      ? formData.propertyTypes.map(t => PROPERTY_TYPES.find(p => p.value === t)?.label).join(', ')
                      : 'Any'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Acreage:</span>
                  <span className="text-white">
                    {formData.acreageRange
                      ? ACREAGE_RANGES.find(r => r.value === formData.acreageRange)?.label
                      : 'Any'}
                  </span>
                </div>
                <hr className="border-slate-600" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Notifications:</span>
                  <span className="text-white">
                    {[formData.notifySms && 'SMS', formData.notifyEmail && 'Email'].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <p className="text-slate-400 text-sm text-center">
                You'll receive alerts when new listings match your criteria.
                Text STOP anytime to unsubscribe.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="text-slate-300 border-slate-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Signing Up...' : 'Start Getting Alerts'}
              <Bell className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

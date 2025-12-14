import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Home, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  Check,
  DollarSign,
  Bed,
  Building2,
  Trees
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://blfieqovcvzgiucuymen.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZmllcW92Y3Z6Z2l1Y3V5bWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MTk5ODIsImV4cCI6MjA0NTk5NTk4Mn0.R3xzKelUhFQB4bHFgM-r2Fd2BXwDnIiPWwk8RoAr0bg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const counties = [
  'Laurel County',
  'Knox County', 
  'Clay County',
  'Whitley County',
  'Pulaski County',
  'Rockcastle County',
  'Madison County',
  'Jackson County',
  'Owsley County',
  'Bell County'
]

const locationTypes = [
  { id: 'city', label: 'City/Town', icon: Building2 },
  { id: 'suburban', label: 'Suburban', icon: Home },
  { id: 'rural', label: 'Rural/Country', icon: Trees },
  { id: 'any', label: 'Any Location', icon: MapPin }
]

const priceRanges = [
  { id: 'under100k', label: 'Under $100,000', min: 0, max: 100000 },
  { id: '100k-200k', label: '$100,000 - $200,000', min: 100000, max: 200000 },
  { id: '200k-300k', label: '$200,000 - $300,000', min: 200000, max: 300000 },
  { id: '300k-500k', label: '$300,000 - $500,000', min: 300000, max: 500000 },
  { id: 'over500k', label: 'Over $500,000', min: 500000, max: 10000000 }
]

const bedroomOptions = [
  { id: '1', label: '1+' },
  { id: '2', label: '2+' },
  { id: '3', label: '3+' },
  { id: '4', label: '4+' },
  { id: '5', label: '5+' }
]

const propertyTypes = [
  'Single Family Home',
  'Townhouse',
  'Condo',
  'Multi-Family',
  'Land/Lot',
  'Farm/Ranch',
  'Mobile Home',
  'Commercial'
]

const acreageOptions = [
  { id: 'any', label: 'Any Size' },
  { id: 'under1', label: 'Under 1 acre' },
  { id: '1-5', label: '1-5 acres' },
  { id: '5-10', label: '5-10 acres' },
  { id: '10-50', label: '10-50 acres' },
  { id: 'over50', label: '50+ acres' }
]

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    counties: [] as string[],
    locationType: '',
    priceRange: '',
    minBedrooms: '',
    propertyTypes: [] as string[],
    acreage: 'any',
    notes: ''
  })

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: 'counties' | 'propertyTypes', value: string) => {
    setFormData(prev => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.phone && formData.email
      case 2:
        return formData.counties.length > 0
      case 3:
        return formData.locationType && formData.priceRange
      case 4:
        return formData.minBedrooms && formData.propertyTypes.length > 0
      case 5:
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
          status: 'active'
        })
        .select()
        .single()

      if (profileError) throw profileError

      const priceRange = priceRanges.find(p => p.id === formData.priceRange)
      
      const { error: criteriaError } = await supabase
        .from('client_criteria')
        .insert({
          client_id: profile.id,
          counties: formData.counties,
          location_type: formData.locationType,
          min_price: priceRange?.min || 0,
          max_price: priceRange?.max || 10000000,
          min_bedrooms: parseInt(formData.minBedrooms) || 1,
          property_types: formData.propertyTypes,
          acreage_preference: formData.acreage
        })

      if (criteriaError) throw criteriaError

      setSuccess(true)
    } catch (err) {
      console.error('Error submitting form:', err)
      setError('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for signing up with The House Team. We'll notify you when new listings match your criteria.
            </p>
            <Button onClick={() => window.location.href = '/'} className="bg-blue-600 hover:bg-blue-700">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <header className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3 text-white">
            <Home className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">The House Team</h1>
              <p className="text-sm text-blue-100">Century 21 Advantage Realty</p>
            </div>
          </a>
          <a href="tel:606-224-3261" className="text-white flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            (606) 224-3261
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Your Dream Home</h1>
          <p className="text-blue-100">Tell us what you're looking for and we'll send you matching listings</p>
        </div>

        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s < step ? 'bg-green-500 text-white' :
                s === step ? 'bg-white text-blue-600' :
                'bg-white/30 text-white'
              }`}>
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 5 && <div className={`w-8 h-1 ${s < step ? 'bg-green-500' : 'bg-white/30'}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Contact Information'}
              {step === 2 && 'Preferred Counties'}
              {step === 3 && 'Location & Budget'}
              {step === 4 && 'Property Preferences'}
              {step === 5 && 'Additional Details'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'How can we reach you about new listings?'}
              {step === 2 && 'Select the counties you\'re interested in'}
              {step === 3 && 'What type of location and price range?'}
              {step === 4 && 'What kind of property are you looking for?'}
              {step === 5 && 'Any additional preferences or notes?'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <Input 
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <Input 
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="Smith"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(606) 555-1234"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      className="pl-10"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {counties.map((county) => (
                  <div
                    key={county}
                    onClick={() => toggleArrayField('counties', county)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                      formData.counties.includes(county)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Checkbox checked={formData.counties.includes(county)} className="mr-2" />
                      <span className="font-medium">{county}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {locationTypes.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => updateField('locationType', type.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition text-center ${
                          formData.locationType === type.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <type.icon className={`h-8 w-8 mx-auto mb-2 ${
                          formData.locationType === type.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <div
                        key={range.id}
                        onClick={() => updateField('priceRange', range.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition flex items-center ${
                          formData.priceRange === range.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <DollarSign className={`h-5 w-5 mr-2 ${
                          formData.priceRange === range.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">{range.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Bedrooms</label>
                  <div className="flex gap-2">
                    {bedroomOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => updateField('minBedrooms', opt.id)}
                        className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition text-center ${
                          formData.minBedrooms === opt.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Bed className={`h-5 w-5 mx-auto mb-1 ${
                          formData.minBedrooms === opt.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Types</label>
                  <div className="grid grid-cols-2 gap-2">
                    {propertyTypes.map((type) => (
                      <div
                        key={type}
                        onClick={() => toggleArrayField('propertyTypes', type)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                          formData.propertyTypes.includes(type)
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <Checkbox checked={formData.propertyTypes.includes(type)} className="mr-2" />
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acreage Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    {acreageOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => updateField('acreage', opt.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                          formData.acreage === opt.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Trees className={`h-5 w-5 mx-auto mb-1 ${
                          formData.acreage === opt.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Any specific features or requirements..."
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : (
                <div />
              )}
              
              {step < 5 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Submitting...' : 'Complete Signup'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

import './App.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Users, 
  Building2, 
  DollarSign,
  Bed,
  Bath,
  Square,
  Facebook,
  Instagram,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const teamMembers = [
  {
    name: "Tabitha House",
    title: "Senior Partner",
    badges: ["Top Producing Agent", "Legacy Partner"],
    phone: "(606) 224-3261",
    email: "thouse@century21advantage.com",
    image: "/images/tabitha-cropped.jpg",
    education: [
      "Bachelor of Arts in Human Services and Counseling",
      "Master's Degree in Education",
      "Originally from Laurel County, KY",
      "Married with four children"
    ],
    specialties: "Commercial and residential properties"
  },
  {
    name: "Dustin House",
    title: "REALTOR",
    badges: ["License #290390"],
    phone: "(606) 231-8571",
    email: "thouse@century21advantage.com",
    image: "/images/dustin-cropped.jpg",
    serviceAreas: [
      "London, KY", "Corbin, KY", "East Bernstadt, KY", "Keavy, KY",
      "Marydell, KY", "Sasser, KY", "Strunk, KY", "Symbol, KY",
      "Tuttle, KY", "Victory, KY", "Woodbine, KY"
    ]
  }
]

const properties = [
  {
    id: 1,
    mlsNumber: "25001234",
    price: 189900,
    address: "Countryside Retreat",
    city: "London",
    state: "KY",
    zip: "40741",
    acres: 6,
    beds: 3,
    baths: 2,
    sqft: 1800,
    description: "HIGHLY MOTIVATED SELLER! Welcome to your countryside retreat! Set on 6 +/- peaceful acres, this charming ranch-style home blends rustic warmth with valuable mineral rights included.",
    features: ["6 Acres", "Ranch Style", "Mineral Rights", "Peaceful Setting", "Country Living"],
    status: "Active",
    agent: "The House Team",
    image: "/images/property1.jpg"
  },
  {
    id: 2,
    mlsNumber: "25001235",
    price: 159900,
    address: "New Listing - London Area",
    city: "London",
    state: "KY",
    zip: "40741",
    beds: 3,
    baths: 2,
    sqft: 1600,
    description: "NEW LISTING! Beautiful home in the London, Kentucky area. Perfect for families looking for quality construction and a great neighborhood.",
    features: ["3 Bedrooms", "2 Full Baths", "Move-In Ready", "Great Location", "Updated"],
    status: "Active",
    agent: "The House Team",
    image: "/images/property2.jpg"
  },
  {
    id: 3,
    mlsNumber: "25001236",
    price: 124900,
    address: "Laurel County Home",
    city: "London",
    state: "KY",
    zip: "40741",
    beds: 3,
    baths: 1,
    sqft: 1400,
    description: "Charming home in Laurel County. Great starter home or investment property with rural charm and easy access to London amenities.",
    features: ["3 Bedrooms", "1 Full Bath", "Rural Setting", "Investment Opportunity", "Large Yard"],
    status: "Active",
    agent: "Tabitha House",
    image: "/images/property3.jpg"
  },
  {
    id: 4,
    mlsNumber: "25001237",
    price: 89900,
    address: "Affordable Country Living",
    city: "East Bernstadt",
    state: "KY",
    zip: "40729",
    beds: 2,
    baths: 1,
    sqft: 1100,
    description: "Affordable country living in East Bernstadt! Perfect for first-time buyers looking for a cozy home with character.",
    features: ["2 Bedrooms", "1 Full Bath", "Affordable", "Country Living", "Starter Home"],
    status: "Active",
    agent: "Dustin House",
    image: "/images/property4.jpg"
  },
  {
    id: 5,
    mlsNumber: "25001238",
    price: 199900,
    address: "Family Home - Corbin Area",
    city: "Corbin",
    state: "KY",
    zip: "40701",
    beds: 4,
    baths: 2,
    sqft: 2200,
    description: "Spacious family home in the Corbin area. Features 4 bedrooms, 2 baths, and plenty of space for the whole family.",
    features: ["4 Bedrooms", "2 Full Baths", "Family Friendly", "Spacious", "Great Schools"],
    status: "Active",
    agent: "Tabitha House",
    image: "/images/property5.jpg"
  },
  {
    id: 6,
    mlsNumber: "25001239",
    price: 74900,
    address: "Building Lot - London",
    city: "London",
    state: "KY",
    zip: "40741",
    acres: 1.5,
    description: "Prime building lot in London, KY. 1.5 acres of beautiful land ready for your dream home. Utilities available at the road.",
    features: ["1.5 Acres", "Utilities Available", "Build Your Dream Home", "Great Location", "Paved Road"],
    status: "Active",
    agent: "The House Team",
    image: "/images/property6.jpg"
  }
]

const services = [
  {
    icon: Home,
    title: "Home Buying",
    description: "Find your perfect home with our expert guidance and local market knowledge."
  },
  {
    icon: DollarSign,
    title: "Home Selling",
    description: "Maximize your property value with our proven marketing strategies and negotiation skills."
  },
  {
    icon: Building2,
    title: "Commercial Properties",
    description: "Expert assistance with commercial real estate investments and transactions."
  }
]

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', phone: '', message: '' })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">The House Team</h1>
                <p className="text-sm text-gray-500">Century 21 Advantage Realty</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition">Home</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition">About</a>
              <a href="#services" className="text-gray-700 hover:text-blue-600 transition">Services</a>
              <a href="#listings" className="text-gray-700 hover:text-blue-600 transition">Listings</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Contact</a>
              <a href="/soq" className="text-yellow-600 hover:text-yellow-700 transition font-semibold">SOQ</a>
            </nav>
            <div className="hidden md:flex items-center space-x-4">
              <a href="tel:606-224-3261" className="flex items-center text-gray-700 hover:text-blue-600">
                <Phone className="h-4 w-4 mr-2" />
              </a>
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col space-y-4">
                <a href="#home" className="text-gray-700 hover:text-blue-600">Home</a>
                <a href="#about" className="text-gray-700 hover:text-blue-600">About</a>
                <a href="#services" className="text-gray-700 hover:text-blue-600">Services</a>
                <a href="#listings" className="text-gray-700 hover:text-blue-600">Listings</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600">Contact</a>
                <a href="/soq" className="text-yellow-600 hover:text-yellow-700 font-semibold">SOQ</a>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full">Get Started</Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <section id="home" className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="bg-yellow-500 text-black mb-6 text-sm px-4 py-1">
              <Award className="h-4 w-4 mr-2 inline" />
              Century 21 Advantage Realty - London, KY
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Your Trusted Real Estate Team in Kentucky</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Dustin & Tabitha House - Experienced professionals helping you find your dream home or sell your property with confidence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
                <Phone className="h-5 w-5 mr-2" />Call Now: (606) 224-3261
              </Button>
              <Button size="lg" className="bg-blue-500 hover:bg-blue-400 border-blue-500">
                <Mail className="h-5 w-5 mr-2" />Email Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet The House Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Professional real estate agents serving London, Kentucky and surrounding areas.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: "/images/gallery1.jpg", alt: "London, Kentucky Real Estate" },
              { src: "/images/gallery2.jpg", alt: "Century 21 Advantage Realty" },
              { src: "/images/gallery3.jpg", alt: "Homes in Laurel County" },
              { src: "/images/gallery4.jpg", alt: "Kentucky Properties" }
            ].map((img, i) => (
              <div key={i} className="relative group overflow-hidden rounded-lg shadow-lg">
                <img src={img.src} alt={img.alt} className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet The House Team</h2>
            <p className="text-lg text-gray-600">A dynamic husband and wife team bringing years of experience to Kentucky real estate.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center mb-6">
                    <img src={member.image} alt={member.name} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-blue-100" />
                    <h3 className="text-2xl font-bold text-gray-900">{member.name}</h3>
                    <p className="text-gray-600">{member.title} {member.badges.map((badge, i) => <span key={i}> &bull; {badge}</span>)}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Phone className="h-4 w-4 mr-3 text-blue-600" />
                      <a href={`tel:${member.phone}`} className="hover:text-blue-600">{member.phone}</a>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Mail className="h-4 w-4 mr-3 text-blue-600" />
                      <a href={`mailto:${member.email}`} className="hover:text-blue-600">{member.email}</a>
                    </div>
                  </div>
                  {member.education && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Education & Background:</h4>
                      <ul className="text-gray-600 text-sm space-y-1">
                        {member.education.map((item, i) => <li key={i}>&bull; {item}</li>)}
                      </ul>
                      <p className="mt-3 text-gray-600"><span className="font-semibold">Specialties:</span> {member.specialties}</p>
                    </div>
                  )}
                  {member.serviceAreas && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Service Areas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.serviceAreas.map((area, i) => <Badge key={i} variant="secondary" className="text-xs">{area}</Badge>)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Comprehensive real estate solutions for all your needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <service.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="listings" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Properties</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Discover our current listings across London, Kentucky and surrounding areas.</p>
            <div className="flex justify-center gap-4 mt-6">
              <Badge className="bg-green-100 text-green-800 text-sm px-4 py-2">23 Active Listings</Badge>
              <Badge className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2">4 Contingent</Badge>
              <Badge className="bg-blue-100 text-blue-800 text-sm px-4 py-2">1 Pending</Badge>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-xl transition">
                <div className="relative">
                  <img src={property.image} alt={property.address} className="w-full h-48 object-cover" />
                  <Badge className="absolute top-4 left-4 bg-green-500">{property.status}</Badge>
                  <Badge className="absolute top-4 right-4 bg-gray-900">MLS# {property.mlsNumber}</Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-blue-600 mb-3">{formatPrice(property.price)}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{property.address}, {property.city}, {property.state} {property.zip}</span>
                  </div>
                  {property.beds && (
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <span className="flex items-center"><Bed className="h-4 w-4 mr-1" /> {property.beds} bed</span>
                      <span className="flex items-center"><Bath className="h-4 w-4 mr-1" /> {property.baths} bath</span>
                      <span className="flex items-center"><Square className="h-4 w-4 mr-1" /> {property.sqft?.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  {property.acres && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <Square className="h-4 w-4 mr-2" /><span>{property.acres} acres</span>
                    </div>
                  )}
                  <p className="text-gray-600 text-sm mb-4">{property.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.features.slice(0, 3).map((feature, i) => <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>)}
                    {property.features.length > 3 && <Badge variant="outline" className="text-xs">+{property.features.length - 3} more</Badge>}
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-3"><strong>Listed by:</strong> {property.agent}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => window.location.href = 'tel:606-224-3261'}><Phone className="h-4 w-4 mr-1" /> Call</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => window.location.href = 'mailto:thouse@century21advantage.com?subject=Inquiry about ' + property.address}><Mail className="h-4 w-4 mr-1" /> Email</Button>
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '#contact'}>View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open('https://www.century21.com/real-estate-agent/profile/tabitha-house-P117953697', '_blank')}>View All 23 Listings<Users className="h-5 w-5 ml-2" /></Button>
            <p className="text-gray-600 mt-4">Contact us today to schedule a showing</p>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600">Ready to start your real estate journey? Get in touch today!</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Get In Touch</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-blue-600 mr-4 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Century 21 Advantage Realty</p>
                    <p className="text-gray-600">911 N Main St, London, KY 40741</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-blue-600 mr-4 mt-1" />
                  <div>
                    <p className="text-gray-600">Tabitha: <a href="tel:606-224-3261" className="hover:text-blue-600">(606) 224-3261</a></p>
                    <p className="text-gray-600">Dustin: <a href="tel:606-231-8571" className="hover:text-blue-600">(606) 231-8571</a></p>
                    <p className="text-gray-600">Office: <a href="tel:606-878-0021" className="hover:text-blue-600">(606) 878-0021</a></p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-blue-600 mr-4 mt-1" />
                  <div>
                    <p className="text-gray-600"><a href="mailto:thouse@century21advantage.com" className="hover:text-blue-600">thouse@century21advantage.com</a></p>
                    <p className="text-gray-600"><a href="mailto:info@century21advantage.com" className="hover:text-blue-600">info@century21advantage.com</a></p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="https://www.facebook.com/p/The-House-Team-Dustin-Tabitha-House-Century-21-Advantage-Realty-100078931847335/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="https://www.instagram.com/c21advantageky/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition">
                    <Instagram className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
            <Card>
              <CardHeader><CardTitle>Send us a message</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <Input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(555) 555-5555" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <Textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="How can we help you?" rows={4} required />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Send Message</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Home className="h-8 w-8 text-blue-400" />
                <div>
                  <h3 className="text-xl font-bold">The House Team</h3>
                  <p className="text-gray-400 text-sm">Century 21 Advantage Realty</p>
                </div>
              </div>
              <p className="text-gray-400">Your trusted real estate partners in Kentucky, dedicated to helping you achieve your property goals.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-white transition">Home</a></li>
                <li><a href="#about" className="hover:text-white transition">About Us</a></li>
                <li><a href="#services" className="hover:text-white transition">Services</a></li>
                <li><a href="#listings" className="hover:text-white transition">Listings</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400">
                <li>911 N Main St, London, KY 40741</li>
                <li>Tabitha: (606) 224-3261</li>
                <li>Dustin: (606) 231-8571</li>
                <li>thouse@century21advantage.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 The House Team - Century 21 Advantage Realty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

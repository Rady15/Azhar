import { useState, useEffect } from 'react'
import { MapPin, BedDouble, Bath, Maximize, ArrowLeft, Building } from 'lucide-react'
import { api, API_BASE_URL, HouseModel } from '../services/api'

function PropertyCard() {
  const [property, setProperty] = useState<HouseModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProperty() {
      try {
        const data = await api.getVillas()
        const list = Array.isArray(data) ? data : (data as any)?.houses ?? []
        if (list.length > 0) {
          setProperty(list[list.length - 1] as HouseModel)
        }
      } catch (err) {
        console.error('Failed to fetch property:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [])

  const resolveImage = (url?: string) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100 flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">جارٍ التحميل...</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100 flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">لا توجد منازل مسجلة</p>
        </div>
      </div>
    )
  }

  const imageUrl = property.imageUrls?.[0] || property.images?.[0] || ''

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100">
      <div className="relative h-48 bg-slate-200">
        {imageUrl ? (
          <img src={resolveImage(imageUrl)} alt={`منزل ${property.houseNumber}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="w-16 h-16 text-slate-300" />
          </div>
        )}
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-primary-700">
          {property.buildingNumber ? `مبنى ${property.buildingNumber}` : 'منزل'}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">منزل رقم {property.houseNumber}</h3>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">{property.contractNumber ? `عقد ${property.contractNumber}` : ''}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          {property.notes || `دور ${property.floorNumber} - مبنى ${property.buildingNumber}`}
        </p>

        <div className="flex items-center gap-4 mb-5">
          {(property.roomsCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <BedDouble className="w-4 h-4" />
              <span className="text-xs">{property.roomsCount} غرف</span>
            </div>
          )}
          {(property.bathroomsCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Bath className="w-4 h-4" />
              <span className="text-xs">{property.bathroomsCount} حمامات</span>
            </div>
          )}
          {(property.area ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Maximize className="w-4 h-4" />
              <span className="text-xs">{property.area} م²</span>
            </div>
          )}
        </div>

        {property.userDisplayName && (
          <p className="text-xs text-slate-400 mb-3">المستأجر: {property.userDisplayName}</p>
        )}

        <button className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors">
          <span>تفاصيل الوحدة</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default PropertyCard

import { MapPin, BedDouble, Bath, Maximize, ArrowLeft } from 'lucide-react'

function PropertyCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100">
      <div className="relative h-48 bg-slate-200">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop"
          alt="فيلا النخيل"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-primary-700">
          مميز
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">فيلا النخيل - وحدة 45</h3>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">حي النخيل، الرياض</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          فيلا حديثة تم إجراء صيانة شاملة لها تشمل ترقية النظام الكهربائي وتحديث التكييف المركزي
        </p>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-slate-500">
            <BedDouble className="w-4 h-4" />
            <span className="text-xs">4 غرف</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Bath className="w-4 h-4" />
            <span className="text-xs">3 حمامات</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Maximize className="w-4 h-4" />
            <span className="text-xs">350 م²</span>
          </div>
        </div>

        <button className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors">
          <span>تفاصيل الوحدة</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default PropertyCard

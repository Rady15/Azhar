import { UserPlus, Wrench, AlertCircle, ArrowLeft } from 'lucide-react'

const updates = [
  {
    id: 1,
    icon: UserPlus,
    color: 'bg-blue-50 text-blue-600',
    title: 'تم إضافة مستأجر جديد',
    description: 'فيلا النخيل - وحدة 12',
    time: 'منذ 22 دقيقة',
  },
  {
    id: 2,
    icon: Wrench,
    color: 'bg-amber-50 text-amber-600',
    title: 'طلب صيانة جديد',
    description: 'مشكلة كهربائية - وحدة 8',
    time: 'منذ ساعة',
  },
  {
    id: 3,
    icon: AlertCircle,
    color: 'bg-red-50 text-red-600',
    title: 'تم تقديم شكوى',
    description: 'ضجيج - وحدة 23',
    time: 'منذ 3 ساعات',
  },
  {
    id: 4,
    icon: UserPlus,
    color: 'bg-blue-50 text-blue-600',
    title: 'تجديد عقد إيجار',
    description: 'فيلا الزيتون - وحدة 5',
    time: 'منذ 5 ساعات',
  },
  {
    id: 5,
    icon: Wrench,
    color: 'bg-amber-50 text-amber-600',
    title: 'تم إنجاز صيانة',
    description: 'سباكة - وحدة 17',
    time: 'منذ 8 ساعات',
  },
]

function RecentUpdates() {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">آخر التحديثات</h3>
      </div>

      <div className="space-y-4">
        {updates.map((update) => (
          <div key={update.id} className="flex gap-3 group">
            <div className={`w-10 h-10 ${update.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <update.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 group-hover:text-primary-700 transition-colors">
                {update.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{update.description}</p>
              <p className="text-xs text-slate-300 mt-1">{update.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 h-10 flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors border border-primary-100">
        <span>عرض جميع الأنشطة</span>
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  )
}

export default RecentUpdates

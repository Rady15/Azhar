import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Zap, Droplets, Wind } from 'lucide-react'

const data = [
  { name: 'كهرباء', value: 6, percentage: 50, color: '#16a34a', icon: Zap },
  { name: 'سباكة', value: 4, percentage: 30, color: '#3b82f6', icon: Droplets },
  { name: 'تكييف', value: 2, percentage: 20, color: '#f59e0b', icon: Wind },
]


function MaintenanceChart() {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">توزيع الصيانة</h3>
        <p className="text-sm text-slate-400 mt-1">إجمالي الطلبات: 12</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  fontSize: '13px',
                  direction: 'rtl',
                }}
                formatter={(value: number, name: string) => [`${value} طلب`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-bold text-slate-800">12</span>
              <p className="text-xs text-slate-400">طلب</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                  <span className="text-sm font-bold text-slate-800">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MaintenanceChart

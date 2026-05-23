import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const monthlyData = [
  { month: 'يناير', value: 45000 },
  { month: 'فبراير', value: 52000 },
  { month: 'مارس', value: 48000 },
  { month: 'أبريل', value: 61000 },
  { month: 'مايو', value: 55000 },
  { month: 'يونيو', value: 67000 },
  { month: 'يوليو', value: 71000 },
  { month: 'أغسطس', value: 58000 },
  { month: 'سبتمبر', value: 63000 },
  { month: 'أكتوبر', value: 69000 },
  { month: 'نوفمبر', value: 74000 },
  { month: 'ديسمبر', value: 78000 },
]

const yearlyData = [
  { month: '2020', value: 520000 },
  { month: '2021', value: 610000 },
  { month: '2022', value: 580000 },
  { month: '2023', value: 720000 },
  { month: '2024', value: 810000 },
]

function ChartSection() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const data = period === 'monthly' ? monthlyData : yearlyData

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">تحصيل المدفوعات الشهرية</h3>
          <p className="text-sm text-slate-400 mt-1">إجمالي المدفوعات المحصلة</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === 'monthly'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            شهري
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === 'yearly'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            سنوي
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                fontSize: '13px',
                direction: 'rtl',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'المبلغ']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#colorValue)"
              dot={{ fill: '#16a34a', strokeWidth: 2, r: 4, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ChartSection

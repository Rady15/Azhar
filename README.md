# أزهار - لوحة تحكم إدارة المجمعات السكنية

## Azhar - Residential Management Dashboard

لوحة تحكم عربية حديثة لإدارة المجمعات السكنية بتصميم نظيف ومتجاوب.

### المميزات
- تصميم RTL كامل باللغة العربية
- رسوم بيانية تفاعلية (شهري/سنوي)
- بطاقات إحصائيات مع شريط تقدم
- مخطط دائري لتوزيع الصيانة
- قائمة جانبية للتنقل
- تصميم متجاوب (Responsive)

### التقنيات المستخدمة
- React 18 + TypeScript
- Tailwind CSS
- Recharts (للرسوم البيانية)
- Lucide React (للأيقونات)
- Vite

### طريقة التشغيل

```bash
# تثبيت التبعيات
npm install

# تشغيل في وضع التطوير
npm run dev

# بناء للإنتاج
npm run build
```

### هيكل المشروع
```
src/
├── components/
│   ├── Header.tsx         # شريط العنوان العلوي
│   ├── Sidebar.tsx        # القائمة الجانبية
│   ├── StatsCards.tsx     # بطاقات الإحصائيات
│   ├── ChartSection.tsx   # الرسم البياني الشهري
│   ├── RecentUpdates.tsx  # آخر التحديثات
│   ├── PropertyCard.tsx   # بطاقة العقار المميز
│   └── MaintenanceChart.tsx # مخطط توزيع الصيانة
├── App.tsx
├── main.tsx
└── index.css
```

### لوحة الألوان
- Primary: أخضر داكن (#16a34a)
- Secondary: أخضر نعناعي
- الخلفية: رمادي فاتح (#f8fafc)
- البطاقات: أبيض مع ظل خفيف

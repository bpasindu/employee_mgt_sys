import React from 'react';
import { 
  Users, 
  Briefcase, 
  Plane, 
  Clock, 
  GraduationCap, 
  CalendarCheck 
} from 'lucide-react';

export default function StatCardsGrid({ stats }) {
  const cards = [
    {
      title: 'Total Employees',
      value: stats?.total_employees ?? 20,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100'
    },
    {
      title: 'Working Today',
      value: stats?.working_today ?? 14,
      icon: Briefcase,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100'
    },
    {
      title: 'On Leave Today',
      value: stats?.on_leave_today ?? 3,
      icon: Plane,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-100'
    },
    {
      title: 'Half Day',
      value: stats?.half_day ?? 2,
      icon: Clock,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-100'
    },
    {
      title: 'Study Leave',
      value: stats?.study_leave ?? 1,
      icon: GraduationCap,
      bgColor: 'bg-sky-50',
      iconColor: 'text-sky-600',
      borderColor: 'border-sky-100'
    },
    {
      title: 'Pending Requests',
      value: stats?.pending_requests ?? 4,
      icon: CalendarCheck,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">{card.title}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h3>
            </div>
            <div className={`w-11 h-11 rounded-2xl ${card.bgColor} ${card.iconColor} ${card.borderColor} border flex items-center justify-center shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

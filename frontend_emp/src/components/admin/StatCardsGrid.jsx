import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  Plane, 
  Clock, 
  GraduationCap, 
  CalendarCheck,
  CalendarDays,
  X,
  Search,
  ArrowRight,
  AlertCircle,
  HeartPulse,
  Palmtree,
  Timer,
  Zap,
  Repeat,
  Layers,
  CloudRain
} from 'lucide-react';

export default function StatCardsGrid({ 
  stats, 
  workingWorkforce = [], 
  todaysLeave = [], 
  halfDayEmployees = [], 
  studyLeaveEmployees = [], 
  specialLeaveEmployees = [],
  pendingLeaveRequests = [],
  upcomingLeaves = [],
  allEmployees = [],
  onNavigateTab 
}) {
  const [activeModal, setActiveModal] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  // Primary top cards
  const primaryCards = [
    {
      id: 'total',
      title: 'Total Employees',
      value: stats?.total_employees ?? allEmployees.length ?? 0,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
      tagline: 'Registered workforce'
    },
    {
      id: 'working',
      title: 'Working Today',
      value: stats?.working_today ?? workingWorkforce.length ?? 0,
      icon: Briefcase,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
      tagline: 'Active on duty'
    },
    {
      id: 'on_leave',
      title: 'On Leave Today',
      value: stats?.on_leave_today ?? (todaysLeave.length + halfDayEmployees.length + studyLeaveEmployees.length + specialLeaveEmployees.length),
      icon: Plane,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-500',
      borderColor: 'border-rose-100',
      tagline: 'Away across all categories'
    },
    {
      id: 'pending',
      title: 'Pending Requests',
      value: stats?.pending_requests ?? pendingLeaveRequests.length ?? 0,
      icon: CalendarCheck,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-100',
      tagline: 'Awaiting admin review'
    },
    {
      id: 'upcoming',
      title: 'Upcoming Leaves',
      value: stats?.upcoming_leaves ?? upcomingLeaves.length ?? 0,
      icon: CalendarDays,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
      tagline: 'Accepted upcoming leaves'
    }
  ];

  // Leave categories breakdown
  const casualList = todaysLeave.filter(e => e.leave_type === 'Casual Leave');
  const medicalList = todaysLeave.filter(e => e.leave_type === 'Medical Leave');
  const shortLeaveList = todaysLeave.filter(e => e.leave_type === 'Short Leave');
  const powerCutList = todaysLeave.filter(e => e.leave_type === 'Power Cut');
  const weatherList = todaysLeave.filter(e => e.leave_type === 'Weather Condition');

  const leaveTypeBoxes = [
    {
      id: 'casual_leave',
      title: 'Casual Leave',
      count: stats?.casual_leave ?? casualList.length,
      icon: Palmtree,
      emoji: '🌿',
      color: 'emerald',
      bgClass: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200/70 hover:border-emerald-300 text-emerald-800',
      iconBg: 'bg-emerald-100/80 text-emerald-700',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      desc: 'Standard casual'
    },
    {
      id: 'medical_leave',
      title: 'Medical Leave',
      count: stats?.medical_leave ?? medicalList.length,
      icon: HeartPulse,
      emoji: '🏥',
      color: 'rose',
      bgClass: 'bg-rose-50/70 hover:bg-rose-50 border-rose-200/70 hover:border-rose-300 text-rose-800',
      iconBg: 'bg-rose-100/80 text-rose-700',
      badgeClass: 'bg-rose-100 text-rose-800',
      desc: 'Medical & sick'
    },
    {
      id: 'half_day',
      title: 'Half Day',
      count: stats?.half_day ?? halfDayEmployees.length,
      icon: Clock,
      emoji: '🌓',
      color: 'amber',
      bgClass: 'bg-amber-50/70 hover:bg-amber-50 border-amber-200/70 hover:border-amber-300 text-amber-800',
      iconBg: 'bg-amber-100/80 text-amber-700',
      badgeClass: 'bg-amber-100 text-amber-800',
      desc: 'AM / PM schedule'
    },
    {
      id: 'short_leave',
      title: 'Short Leave',
      count: stats?.short_leave ?? shortLeaveList.length,
      icon: Timer,
      emoji: '⏱️',
      color: 'indigo',
      bgClass: 'bg-indigo-50/70 hover:bg-indigo-50 border-indigo-200/70 hover:border-indigo-300 text-indigo-800',
      iconBg: 'bg-indigo-100/80 text-indigo-700',
      badgeClass: 'bg-indigo-100 text-indigo-800',
      desc: 'Max 3 hours'
    },
    {
      id: 'study_leave',
      title: 'Study Leave',
      count: stats?.study_leave ?? studyLeaveEmployees.length,
      icon: GraduationCap,
      emoji: '🎓',
      color: 'sky',
      bgClass: 'bg-sky-50/70 hover:bg-sky-50 border-sky-200/70 hover:border-sky-300 text-sky-800',
      iconBg: 'bg-sky-100/80 text-sky-700',
      badgeClass: 'bg-sky-100 text-sky-800',
      desc: 'Academic & exams'
    },
    {
      id: 'special_leave',
      title: 'Special Leave',
      count: stats?.special_leave ?? specialLeaveEmployees.length,
      icon: Repeat,
      emoji: '🔁',
      color: 'purple',
      bgClass: 'bg-purple-50/70 hover:bg-purple-50 border-purple-200/70 hover:border-purple-300 text-purple-800',
      iconBg: 'bg-purple-100/80 text-purple-700',
      badgeClass: 'bg-purple-100 text-purple-800',
      desc: 'Weekly recurring'
    },
    {
      id: 'power_cut',
      title: 'Power Cut',
      count: stats?.power_cut_leave ?? powerCutList.length,
      icon: Zap,
      emoji: '⚡',
      color: 'yellow',
      bgClass: 'bg-yellow-50/70 hover:bg-yellow-50 border-yellow-200/70 hover:border-yellow-300 text-yellow-800',
      iconBg: 'bg-yellow-100/80 text-yellow-700',
      badgeClass: 'bg-yellow-100 text-yellow-800',
      desc: 'Emergency outage'
    },
    {
      id: 'weather_condition',
      title: 'Weather Condition',
      count: stats?.weather_condition_leave ?? weatherList.length,
      icon: CloudRain,
      emoji: '🌧️',
      color: 'sky',
      bgClass: 'bg-sky-50/70 hover:bg-sky-50 border-sky-200/70 hover:border-sky-300 text-sky-800',
      iconBg: 'bg-sky-100/80 text-sky-700',
      badgeClass: 'bg-sky-100 text-sky-800',
      desc: 'Rain & thunder'
    }
  ];

  const handleOpenModal = (cardId) => {
    setActiveModal(cardId);
    setModalSearch('');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setModalSearch('');
  };

  // Helper to get modal details and data
  const getModalConfig = () => {
    const term = modalSearch.toLowerCase();

    switch (activeModal) {
      case 'total': {
        const list = allEmployees.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.status && e.status.toLowerCase().includes(term))
        );
        return {
          title: 'All Registered Employees',
          subtitle: 'Complete company workforce directory across all departments',
          icon: Users,
          iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
          badgeColor: 'bg-blue-100 text-blue-800',
          totalCount: allEmployees.length,
          items: list,
          type: 'total'
        };
      }
      case 'working': {
        const list = workingWorkforce.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.today_work && e.today_work.toLowerCase().includes(term))
        );
        return {
          title: 'Employees Working Today',
          subtitle: 'Staff members currently on active duty today',
          icon: Briefcase,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          totalCount: workingWorkforce.length,
          items: list,
          type: 'working'
        };
      }
      case 'on_leave': {
        const combinedLeaves = [
          ...todaysLeave,
          ...halfDayEmployees,
          ...studyLeaveEmployees,
          ...specialLeaveEmployees
        ];
        // Deduplicate by ID
        const uniqueLeaves = Array.from(new Map(combinedLeaves.map(item => [item.id, item])).values());
        const list = uniqueLeaves.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.leave_type && e.leave_type.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'All Employees On Leave Today',
          subtitle: 'Staff away today across all approved leave categories',
          icon: Plane,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          badgeColor: 'bg-rose-100 text-rose-800',
          totalCount: uniqueLeaves.length,
          items: list,
          type: 'on_leave'
        };
      }
      case 'casual_leave': {
        const list = casualList.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Casual Leave - Today',
          subtitle: 'Employees on approved casual leave today',
          icon: Palmtree,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          totalCount: casualList.length,
          items: list,
          type: 'casual_leave'
        };
      }
      case 'medical_leave': {
        const list = medicalList.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Medical / Sick Leave - Today',
          subtitle: 'Employees away due to approved medical or illness reasons',
          icon: HeartPulse,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          badgeColor: 'bg-rose-100 text-rose-800',
          totalCount: medicalList.length,
          items: list,
          type: 'medical_leave'
        };
      }
      case 'half_day': {
        const list = halfDayEmployees.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.session && e.session.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Half-Day Employees Today',
          subtitle: 'Staff on scheduled Morning or Evening half-day duty',
          icon: Clock,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          badgeColor: 'bg-amber-100 text-amber-800',
          totalCount: halfDayEmployees.length,
          items: list,
          type: 'half_day'
        };
      }
      case 'short_leave': {
        const list = shortLeaveList.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Short Leave (Up to 3 hrs) - Today',
          subtitle: 'Staff members away on approved short leaves today',
          icon: Timer,
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
          badgeColor: 'bg-indigo-100 text-indigo-800',
          totalCount: shortLeaveList.length,
          items: list,
          type: 'short_leave'
        };
      }
      case 'study_leave': {
        const list = studyLeaveEmployees.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Study Leave Employees',
          subtitle: 'Staff scheduled for approved examinations or academic studies today',
          icon: GraduationCap,
          iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
          badgeColor: 'bg-sky-100 text-sky-800',
          totalCount: studyLeaveEmployees.length,
          items: list,
          type: 'study_leave'
        };
      }
      case 'special_leave': {
        const list = specialLeaveEmployees.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Special Leave (Weekly Recurring)',
          subtitle: 'Staff scheduled for approved weekly recurring special leaves',
          icon: Repeat,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
          badgeColor: 'bg-purple-100 text-purple-800',
          totalCount: specialLeaveEmployees.length,
          items: list,
          type: 'special_leave'
        };
      }
      case 'power_cut': {
        const list = powerCutList.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Power Cut Emergency Leave',
          subtitle: 'Staff granted emergency leave due to power outages',
          icon: Zap,
          iconBg: 'bg-yellow-50 text-yellow-600 border-yellow-200',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          totalCount: powerCutList.length,
          items: list,
          type: 'power_cut'
        };
      }
      case 'weather_condition': {
        const list = weatherList.filter(e => 
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Weather Condition Emergency Leave',
          subtitle: 'Staff on leave due to high raining or thunder conditions',
          icon: CloudRain,
          iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
          badgeColor: 'bg-sky-100 text-sky-800',
          totalCount: weatherList.length,
          items: list,
          type: 'weather_condition'
        };
      }
      case 'pending': {
        const list = pendingLeaveRequests.filter(e => 
          (e.employee_name && e.employee_name.toLowerCase().includes(term)) ||
          (e.leave_type && e.leave_type.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Pending Leave Applications',
          subtitle: 'Leave requests awaiting administrative review and approval',
          icon: CalendarCheck,
          iconBg: 'bg-orange-50 text-orange-600 border-orange-200',
          badgeColor: 'bg-orange-100 text-orange-800',
          totalCount: pendingLeaveRequests.length,
          items: list,
          type: 'pending'
        };
      }
      case 'upcoming': {
        const list = upcomingLeaves.filter(e => 
          (e.employee_name && e.employee_name.toLowerCase().includes(term)) ||
          (e.leave_type && e.leave_type.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.reason && e.reason.toLowerCase().includes(term))
        );
        return {
          title: 'Upcoming Approved Leaves',
          subtitle: 'Scheduled upcoming leaves that have been accepted and approved',
          icon: CalendarDays,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
          badgeColor: 'bg-purple-100 text-purple-800',
          totalCount: upcomingLeaves.length,
          items: list,
          type: 'upcoming'
        };
      }
      default:
        return null;
    }
  };

  const modalConfig = activeModal ? getModalConfig() : null;

  return (
    <div className="space-y-5 mb-8">
      {/* 1. Primary Top Summary Cards (5 Cards: Total, Working, On Leave, Pending, Upcoming) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {primaryCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => handleOpenModal(card.id)}
              className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-center justify-between hover:shadow-md hover:border-blue-300 hover:scale-[1.01] transition-all cursor-pointer group relative overflow-hidden"
              title={`Click to view details for ${card.title}`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <span>{card.title}</span>
                  <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    • View ↗
                  </span>
                </p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{card.tagline}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${card.bgColor} ${card.iconColor} ${card.borderColor} border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs`}>
                <IconComponent className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Leave Types Breakdown by Category (Small Compact Boxes) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Today's Leave Breakdown by Type</h4>
              <p className="text-[11px] text-slate-500">Live breakdown across all 7 leave categories</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium self-start sm:self-auto">
            Click any box to inspect employees
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {leaveTypeBoxes.map((box) => {
            const IconComp = box.icon;
            const hasActive = box.count > 0;
            return (
              <div
                key={box.id}
                onClick={() => handleOpenModal(box.id)}
                className={`group relative rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                  hasActive 
                    ? `${box.bgClass} shadow-xs hover:shadow-sm scale-[1.01]` 
                    : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/70 hover:border-slate-300 text-slate-700 opacity-90 hover:opacity-100'
                }`}
                title={`Click to view employees on ${box.title}`}
              >
                {/* Top header with icon & count */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    hasActive ? box.iconBg : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xl font-extrabold tracking-tight ${
                    hasActive ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {box.count}
                  </span>
                </div>

                {/* Title & subtitle */}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold leading-tight truncate text-slate-900">
                      {box.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                    {box.desc}
                  </p>
                </div>

                {/* Status indicator bottom badge */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/40 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    hasActive ? box.badgeClass : 'bg-slate-100 text-slate-400'
                  }`}>
                    {hasActive ? `${box.count} active` : '0 away'}
                  </span>
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    ↗
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Details Modal */}
      {modalConfig && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div 
            className={`bg-white rounded-3xl ${modalConfig.type === 'upcoming' ? 'max-w-6xl' : 'max-w-2xl'} w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${modalConfig.iconBg} border flex items-center justify-center shrink-0 shadow-2xs`}>
                  <modalConfig.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900">{modalConfig.title}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${modalConfig.badgeColor}`}>
                      {modalConfig.totalCount} {modalConfig.totalCount === 1 ? 'Person' : 'People'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{modalConfig.subtitle}</p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search within Modal */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Filter by name, department, or status..."
                className="w-full text-xs text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                autoFocus
              />
              {modalSearch && (
                <button onClick={() => setModalSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
                  Clear
                </button>
              )}
            </div>

            {/* Modal List Content */}
            <div className={`flex-1 overflow-y-auto ${modalConfig.type === 'upcoming' ? 'p-0' : 'p-6 space-y-3 divide-y divide-slate-50'}`}>
              {modalConfig.items.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No matching employees found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {modalSearch ? 'Try a different search query.' : 'Currently no entries in this category today.'}
                  </p>
                </div>
              ) : modalConfig.type === 'upcoming' ? (
                /* Dedicated Upcoming Approved Leaves Table Layout */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                        <th className="py-3.5 pl-6 pr-3 w-16 text-center">Photo</th>
                        <th className="py-3.5 px-3 min-w-[170px]">Employee & Dept</th>
                        <th className="py-3.5 px-3 min-w-[200px] max-w-[280px]">Reason</th>
                        <th className="py-3.5 px-3 min-w-[130px] text-center">Leave Type</th>
                        <th className="py-3.5 px-3 min-w-[120px] text-center">Leave Count Days</th>
                        <th className="py-3.5 pl-3 pr-6 min-w-[220px]">Leave Days / Dates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {modalConfig.items.map((item, idx) => {
                        const from = (item.from_date || item.start_date || '').split('T')[0];
                        const to = (item.to_date || item.end_date || '').split('T')[0];
                        const isSpecial = item.leave_type === 'Special Leave';

                        // Clean reason text: remove redundant prefix tags
                        let cleanReason = item.reason || item.leave_reason || '—';
                        const matchPrefix = cleanReason.match(/^\[(?:Special Leave|Short Leave|Half Day|Power Cut|Weather Condition)[^\]]*\]\s*(.*)$/i);
                        if (matchPrefix) {
                          cleanReason = matchPrefix[1].trim() || '—';
                        }

                        // Calculate business dates and weekday names (exclude Sat & Sun)
                        const datesList = [];
                        if (from) {
                          const start = new Date(from + 'T00:00:00');
                          const end = new Date((to || from) + 'T00:00:00');
                          if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                            const cur = new Date(start);
                            while (cur <= end) {
                              const dow = cur.getDay();
                              if (dow !== 0 && dow !== 6) { // skip Saturdays & Sundays
                                const y = cur.getFullYear();
                                const m = String(cur.getMonth() + 1).padStart(2, '0');
                                const d = String(cur.getDate()).padStart(2, '0');
                                const dayName = cur.toLocaleDateString('en-US', { weekday: 'long' });
                                datesList.push({ dateStr: `${y}-${m}-${d}`, dayName });
                              }
                              cur.setDate(cur.getDate() + 1);
                            }
                          }
                        }

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                            {/* 1. Profile Photo */}
                            <td className="py-3.5 pl-6 pr-3 align-middle text-center">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs overflow-hidden mx-auto">
                                {item.photo_url ? (
                                  <img 
                                    src={item.photo_url} 
                                    alt={item.employee_name || 'Employee'} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentNode.textContent = item.initials || 'EP';
                                    }}
                                  />
                                ) : (
                                  <span>{item.initials || 'EP'}</span>
                                )}
                              </div>
                            </td>

                            {/* 2. Employee Name & Department */}
                            <td className="py-3.5 px-3 align-middle">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{item.employee_name || item.name || 'Employee'}</span>
                                {item.role === 'Admin' && (
                                  <span className="bg-purple-100 text-purple-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {item.department || 'General'}
                              </div>
                            </td>

                            {/* 3. Reason */}
                            <td className="py-3.5 px-3 align-middle">
                              <div className="text-slate-700 text-xs font-medium leading-relaxed break-words max-w-[260px]">
                                {cleanReason}
                              </div>
                            </td>

                            {/* 4. Leave Type */}
                            <td className="py-3.5 px-3 align-middle text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-2xs ${
                                item.leave_type === 'Casual Leave' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                item.leave_type === 'Medical Leave' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                item.leave_type === 'Study Leave' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                item.leave_type === 'Special Leave' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                item.leave_type === 'Half Day' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                item.leave_type === 'Short Leave' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                item.leave_type === 'Power Cut' ? 'bg-yellow-50 text-yellow-800 border-yellow-300' :
                                item.leave_type === 'Weather Condition' ? 'bg-sky-50 text-sky-800 border-sky-300' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {item.leave_type}
                              </span>
                            </td>

                            {/* 5. Leave Count Days */}
                            <td className="py-3.5 px-3 align-middle text-center">
                              <span className="inline-block bg-slate-100 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md border border-slate-200/80">
                                {item.days_count} {Number(item.days_count) === 1 ? 'Day' : 'Days'}
                              </span>
                            </td>

                            {/* 6. Leave Dates & Days */}
                            <td className="py-3.5 pl-3 pr-6 align-middle">
                              {isSpecial ? (
                                <div className="space-y-1.5">
                                  <div className="font-bold text-slate-800 text-xs">
                                    {from && to && from !== to ? `${from} to ${to}` : (from || 'Scheduled')}
                                  </div>
                                  <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                                    <span>🔄 Recurring:</span>
                                    <span>{item.day_of_week ? item.day_of_week.split(',').map(s => s.trim()).join(', ') : (item.duration || 'Weekly')}</span>
                                  </div>
                                  {item.next_leave_date && (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200/80">
                                      <span>Next Leave:</span>
                                      <span>{item.next_leave_date}</span>
                                      {(() => {
                                        const nd = new Date(item.next_leave_date + 'T00:00:00');
                                        return !isNaN(nd.getTime()) ? `(${nd.toLocaleDateString('en-US', { weekday: 'short' })})` : '';
                                      })()}
                                    </div>
                                  )}
                                </div>
                              ) : (!to || from === to) ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 text-xs">{from}</div>
                                  {datesList[0] && (
                                    <div className="text-[11px] font-semibold text-slate-600">
                                      {datesList[0].dayName}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-800 text-xs">
                                    {from} to {to}
                                  </div>
                                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-1 font-medium">
                                    {datesList.length <= 4 ? (
                                      datesList.map((d, i) => (
                                        <span key={i} className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] border border-slate-200/60 font-semibold">
                                          {d.dateStr} ({d.dayName})
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-slate-500 font-semibold">
                                        Weekdays: {Array.from(new Set(datesList.map(d => d.dayName))).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                modalConfig.items.map((item, idx) => {
                  return (
                    <div 
                      key={item.id || idx} 
                      className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-200/60"
                    >
                      {/* Left: Avatar + Details */}
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs overflow-hidden">
                          {item.photo_url ? (
                            <img src={item.photo_url} alt={item.name || item.employee_name} className="w-full h-full object-cover" />
                          ) : (
                            item.initials || (item.name ? item.name.slice(0, 2).toUpperCase() : 'EM')
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {item.name || item.employee_name || 'Employee'}
                            </span>
                            {item.role === 'Admin' && (
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {item.department || 'General'}
                          </p>
                          {/* Reason or today's work summary */}
                          {item.leave_reason && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                              Reason: {item.leave_reason}
                            </p>
                          )}
                          {item.reason && !item.leave_reason && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                              Reason: {item.reason}
                            </p>
                          )}
                          {item.today_work && (() => {
                            const clean = item.today_work.replace(/\[WorkEntries:\s*\[.*?\]\]/gis, '').replace(/\n?\[Clients:[^\]]+\]/gi, '').replace(/\n?\[After Office(?:\s*Hours)?:\s*[^\]]+\]/gi, '').trim();
                            const afterOfficeMatch = item.today_work.match(/\[After Office(?:\s*Hours)?:\s*([^\]]+)\]/i);
                            return (
                              <div className="mt-0.5 space-y-1">
                                <p className="text-[11px] text-slate-600 line-clamp-1">
                                  💼 Work: {clean || 'Work submitted'}
                                </p>
                                {afterOfficeMatch && afterOfficeMatch[1] && (
                                  <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-2xs">
                                    <span>After Office: {afterOfficeMatch[1].trim()}</span>
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right: Badges & Timing */}
                      <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1 shrink-0">
                        {modalConfig.type === 'casual_leave' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                            🌿 Casual Leave {item.duration ? `(${item.duration})` : ''}
                          </span>
                        )}

                        {modalConfig.type === 'medical_leave' && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                            🏥 Medical Leave {item.duration ? `(${item.duration})` : ''}
                          </span>
                        )}

                        {modalConfig.type === 'short_leave' && (
                          <div className="flex flex-col sm:items-end gap-0.5">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                              ⏱️ Short Leave
                            </span>
                            {(item.start_time || item.duration) && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                {item.start_time && item.end_time ? `${item.start_time} - ${item.end_time}` : item.duration}
                              </span>
                            )}
                          </div>
                        )}

                        {modalConfig.type === 'half_day' && (
                          <div className="flex flex-col sm:items-end gap-0.5">
                            <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                              {item.session || item.half_day_type || 'Morning Session'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.half_day_leave_now ? '🏖️ Away on Leave now' : '💼 Working now'}
                            </span>
                          </div>
                        )}

                        {modalConfig.type === 'study_leave' && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                            🎓 Study Leave
                          </span>
                        )}

                        {modalConfig.type === 'special_leave' && (
                          <div className="flex flex-col sm:items-end gap-1">
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                              🔁 {item.days || item.duration || 'Special Leave'}
                            </span>
                            {item.is_half_day && (
                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  item.half_day_leave_now ?? item.is_leave_now
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {(item.half_day_leave_now ?? item.is_leave_now) ? '🏖️ Away on Leave now' : '💼 Working now'}
                                </span>
                                {(item.leave_time || item.session) && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {item.leave_time || item.session}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {modalConfig.type === 'power_cut' && (
                          <span className="bg-yellow-50 text-yellow-800 border border-yellow-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                            ⚡ Power Cut Leave
                          </span>
                        )}

                        {modalConfig.type === 'weather_condition' && (
                          <span className="bg-sky-50 text-sky-800 border border-sky-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                            🌧️ Weather Condition Leave
                          </span>
                        )}

                        {modalConfig.type === 'on_leave' && (
                          <div className="flex flex-col sm:items-end gap-0.5">
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                              {item.leave_type || 'On Leave'}
                            </span>
                            {item.duration && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {item.duration}
                              </span>
                            )}
                          </div>
                        )}

                        {modalConfig.type === 'working' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                            ● Working Today
                          </span>
                        )}

                        {modalConfig.type === 'total' && (
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                            item.status && item.status.includes('Working')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.status || 'Active'}
                          </span>
                        )}

                        {modalConfig.type === 'pending' && (
                          <div className="flex flex-col sm:items-end gap-1">
                            <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                              {item.leave_type} ({item.days_count} {item.days_count === 1 ? 'day' : 'days'})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.from_date} → {item.to_date}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Showing {modalConfig.items.length} of {modalConfig.totalCount} employees
              </span>
              <div className="flex items-center gap-2">
                {modalConfig.type === 'pending' && onNavigateTab && (
                  <button
                    onClick={() => {
                      handleCloseModal();
                      onNavigateTab('admin-leave-requests');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Manage Leave Requests</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {modalConfig.type === 'upcoming' && onNavigateTab && (
                  <button
                    onClick={() => {
                      handleCloseModal();
                      onNavigateTab('calendar');
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>View in Leave Calendar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

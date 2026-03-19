import React from 'react';
import { ClipboardList, History as HistoryIcon, Beaker, BookOpen, Calculator, UserPlus, Send as SendIcon, BellRing } from 'lucide-react';
import { REPLACEMENT_REQUESTS, PAST_REPLACEMENTS, AVAILABLE_STAFF } from '../constants';

export const Replacements: React.FC = () => {
  return (
    <div className="space-y-10 pb-32">
      {/* Header */}
      <div>
        <p className="text-primary font-headline font-extrabold tracking-tight text-sm uppercase mb-2">Replacements Hub</p>
        <h2 className="font-headline font-bold text-4xl text-on-background">Requests & Staffing</h2>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Requests */}
        <div className="lg:col-span-8 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl flex items-center gap-2">
                <ClipboardList className="text-primary" size={24} />
                Current Replacement Requests
              </h3>
              <span className="bg-tertiary-container text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">3 Urgent</span>
            </div>
            <div className="space-y-3">
              {REPLACEMENT_REQUESTS.map(req => (
                <div key={req.id} className={`bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 ${req.urgent ? 'border-tertiary' : 'border-primary'} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-surface-container-high group`}>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center">
                      {req.icon === 'science' && <Beaker className="text-tertiary" size={24} />}
                      {req.icon === 'menu_book' && <BookOpen className="text-primary" size={24} />}
                      {req.icon === 'calculate' && <Calculator className="text-primary" size={24} />}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-lg text-on-surface">{req.class}</h4>
                      <p className="text-on-surface-variant text-sm flex items-center gap-1">
                        Requested by <span className="font-semibold text-primary">{req.requestedBy}</span> • {req.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-surface-container text-primary font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-all">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md active:scale-95 transition-transform">
                      <UserPlus size={16} />
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* History Section */}
          <section className="pt-6">
            <h3 className="font-headline font-bold text-xl mb-6 flex items-center gap-2">
              <HistoryIcon className="text-on-surface-variant" size={24} />
              Past Replacements
            </h3>
            <div className="bg-surface-container-low rounded-3xl overflow-hidden">
              <div className="grid grid-cols-4 px-6 py-4 border-b border-outline-variant/20 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span>Class</span>
                <span>Instructor</span>
                <span>Replacement</span>
                <span className="text-right">Status</span>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {PAST_REPLACEMENTS.map(past => (
                  <div key={past.id} className="grid grid-cols-4 px-6 py-4 items-center hover:bg-surface-container transition-colors">
                    <span className="font-bold text-sm">{past.class}</span>
                    <span className="text-sm text-on-surface-variant">{past.instructor}</span>
                    <div className="flex items-center gap-2">
                      <img className="w-6 h-6 rounded-full object-cover" src={past.replacementAvatar} alt={past.replacement} referrerPolicy="no-referrer" />
                      <span className="text-sm">{past.replacement}</span>
                    </div>
                    <div className="text-right">
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Available Staff */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <section className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg mb-4">Available for Coverage</h3>
              <div className="space-y-4">
                {AVAILABLE_STAFF.map(staff => (
                  <div key={staff.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low group hover:bg-primary-fixed transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img className="w-10 h-10 rounded-full object-cover" src={staff.avatar} alt={staff.name} referrerPolicy="no-referrer" />
                        {staff.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary border-2 border-white rounded-full"></div>}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{staff.name}</p>
                        <p className="text-[11px] text-on-surface-variant uppercase tracking-tighter">{staff.role}</p>
                      </div>
                    </div>
                    <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <SendIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 border-2 border-dashed border-outline-variant text-on-surface-variant text-sm font-bold rounded-2xl hover:bg-surface-container transition-colors">
                Find More Staff
              </button>
            </section>

            {/* Quick Notification Box */}
            <section className="bg-primary p-6 rounded-3xl text-white shadow-xl shadow-primary/20">
              <BellRing className="mb-2" size={24} />
              <h3 className="font-headline font-bold text-lg mb-2">Mass Alert</h3>
              <p className="text-on-primary-container text-xs mb-4">Send a push notification to all qualified staff for the next urgent Physics seminar.</p>
              <button className="w-full py-2.5 bg-white text-primary font-bold rounded-xl text-sm shadow-sm active:scale-90 transition-transform">
                Send Notification
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

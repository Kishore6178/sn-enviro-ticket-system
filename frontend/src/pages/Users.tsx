import React from 'react';
import { Users as UsersIcon, Mail, Briefcase, MapPin, Copy, CheckCircle2, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import { engineersData, type Engineer } from '../lib/engineers';

export const Users: React.FC = () => {
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(`Copied ${email} to clipboard!`);
  };

  const embeddedEngineers = engineersData.filter(e => e.designation === 'Embedded Engineer');
  const regionalHeads = engineersData.filter(e => e.designation === 'Regional Head');
  const fieldEngineers = engineersData.filter(e => e.designation === 'Field Application Engineer');

  // Group fieldEngineers by region
  const fieldByRegion = fieldEngineers.reduce((acc, engineer) => {
    let key = 'Other';
    const regionLower = engineer.region.toLowerCase();
    
    if (regionLower.includes('north-east')) key = 'North-East';
    else if (regionLower.includes('north')) key = 'North';
    else if (regionLower.includes('central')) key = 'Central';
    else if (regionLower.includes('telangana')) key = 'Telangana & AP';
    else if (regionLower.includes('south')) key = 'South';
    else if (regionLower.includes('east')) key = 'East';
    else if (regionLower.includes('west')) key = 'West';
    else key = engineer.region.split('(')[0].trim();

    if (!acc[key]) acc[key] = [];
    acc[key].push(engineer);
    return acc;
  }, {} as Record<string, Engineer[]>);

  const renderEngineerCard = (engineer: Engineer, index: number) => (
    <div key={index} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start space-x-4 w-full">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 mt-1">
              {engineer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-[16px] leading-tight break-words">{engineer.name}</h3>
              <div className="flex items-center text-emerald-600 text-[12px] font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                Active
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <div className="flex items-start text-[14px] text-foreground bg-secondary p-3 rounded-xl border border-border">
            <Briefcase className="w-4.5 h-4.5 text-blue-500 mr-3 shrink-0 mt-0.5" />
            <span className="font-medium break-words leading-tight">{engineer.designation}</span>
          </div>
          
          <div className="flex items-start text-[14px] text-foreground bg-secondary p-3 rounded-xl border border-border">
            <MapPin className="w-4.5 h-4.5 text-blue-500 mr-3 shrink-0 mt-0.5" />
            <span className="font-medium break-words leading-tight">{engineer.region}</span>
          </div>

          <div className="flex items-center text-[13px] text-foreground bg-blue-50/50 p-3 rounded-xl border border-blue-100 group-hover:bg-blue-50 transition-colors mt-3">
            <Mail className="w-4.5 h-4.5 text-blue-600 mr-3 shrink-0" />
            <span className="font-semibold text-blue-900 truncate flex-1 mr-2" title={engineer.email}>{engineer.email}</span>
            <button 
              onClick={() => handleCopyEmail(engineer.email)}
              className="p-2 text-blue-600 hover:text-white bg-blue-200/50 hover:bg-blue-600 rounded-lg transition-colors shrink-0 shadow-sm"
              title="Copy Email for Assignment"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-16 px-4 sm:px-6">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-5">
          <div className="h-14 w-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center shadow-sm">
            <UsersIcon className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Engineers & Technicians</h2>
            <p className="text-muted-foreground text-[15px] mt-1.5 font-medium">Manage your field force and embedded systems team</p>
          </div>
        </div>
      </div>

      {/* Leadership Section */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center space-x-3 border-b border-border pb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Briefcase className="w-6 h-6 text-purple-700" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Leadership & Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-2">
          {[
            { name: 'David', role: 'MD of Company', email: 'david@snenviro.com', color: 'from-purple-600 to-indigo-600' },
            { name: 'Ramesh', role: 'Head of Service', email: 'ramesh@snenviro.com', color: 'from-blue-600 to-cyan-600' },
            { name: 'Nagaraju P', role: 'Service Manager', email: 'nagarajup@snenviro.com', color: 'from-emerald-600 to-teal-600' },
            { name: 'Sudhakar', role: 'Admin and Accounts', email: 'sales@snenvio.com', color: 'from-amber-500 to-orange-600' },
          ].map((leader, idx) => (
            <div key={idx} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-300 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-start space-x-4 w-full mb-4">
                  <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${leader.color} flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0`}>
                    {leader.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 mt-1">
                    <h3 className="font-bold text-foreground text-[16px] leading-tight break-words">{leader.name}</h3>
                    <div className="text-purple-600 text-[13px] font-bold mt-1">
                      {leader.role}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-[13px] text-foreground bg-secondary p-3 rounded-xl border border-border group-hover:bg-purple-50 transition-colors mt-4">
                  <Mail className="w-4.5 h-4.5 text-purple-600 mr-3 shrink-0" />
                  <span className="font-semibold text-foreground truncate flex-1 mr-2" title={leader.email}>{leader.email}</span>
                  <button 
                    onClick={() => handleCopyEmail(leader.email)}
                    className="p-2 text-purple-600 hover:text-white bg-purple-100 hover:bg-purple-600 rounded-lg transition-colors shrink-0 shadow-sm"
                    title="Copy Email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Heads Section */}
      {regionalHeads.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <MapPin className="w-6 h-6 text-rose-700" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Regional Heads</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-2">
            {regionalHeads.map((head, idx) => {
              const colors = [
                'from-rose-500 to-pink-600',
                'from-fuchsia-600 to-purple-600',
                'from-violet-600 to-indigo-600',
                'from-blue-500 to-cyan-600',
                'from-teal-500 to-emerald-600',
                'from-amber-500 to-orange-600',
                'from-red-500 to-rose-600'
              ];
              const color = colors[idx % colors.length];
              
              return (
                <div key={idx} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-300 overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-start space-x-4 w-full mb-4">
                      <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0`}>
                        {head.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 mt-1">
                        <h3 className="font-bold text-foreground text-[16px] leading-tight break-words">{head.name}</h3>
                        <div className="text-rose-600 text-[13px] font-bold mt-1">
                          {head.region} Head
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-[13px] text-foreground bg-secondary p-3 rounded-xl border border-border group-hover:bg-rose-50 transition-colors mt-4">
                      <Mail className="w-4.5 h-4.5 text-rose-600 mr-3 shrink-0" />
                      <span className="font-semibold text-foreground truncate flex-1 mr-2" title={head.email}>{head.email}</span>
                      <button 
                        onClick={() => handleCopyEmail(head.email)}
                        className="p-2 text-rose-600 hover:text-white bg-rose-100 hover:bg-rose-600 rounded-lg transition-colors shrink-0 shadow-sm"
                        title="Copy Email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded Engineers Section (Top) */}
      {embeddedEngineers.length > 0 && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Cpu className="w-6 h-6 text-indigo-700" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Embedded Engineers</h3>
            <span className="bg-secondary text-muted-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {embeddedEngineers.length} {embeddedEngineers.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
            {embeddedEngineers.map((engineer, index) => renderEngineerCard(engineer, index))}
          </div>
        </div>
      )}

      {/* Field Application Engineers Section (Grouped by Region) */}
      <div className="space-y-10 pt-4">
        <div className="flex items-center space-x-3 border-b border-border pb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="w-6 h-6 text-blue-700" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Field Application Engineers</h3>
          <span className="bg-secondary text-muted-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            By Region
          </span>
        </div>

        <div className="space-y-10">
          {Object.entries(fieldByRegion).map(([region, engineers]) => (
            <div key={region} className="space-y-5 pl-2 sm:pl-4 border-l-4 border-blue-100">
              <div className="flex items-center space-x-3">
                <h4 className="text-xl font-bold text-foreground tracking-tight">{region} Region</h4>
                <span className="bg-secondary text-muted-foreground text-xs font-semibold px-2.5 py-1 rounded-md">
                  {engineers.length} {engineers.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {engineers.map((engineer, index) => renderEngineerCard(engineer, index))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

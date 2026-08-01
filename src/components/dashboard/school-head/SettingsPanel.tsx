'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SettingsPanel: React.FC = () => {
  // General School Properties States
  const [schoolName, setSchoolName] = useState('Bole Community School');
  const [schoolPrincipal, setSchoolPrincipal] = useState('Dr. Semeneh Yohannes');
  const [schoolPhone, setSchoolPhone] = useState('+251-11-662-1234');
  const [schoolRegion, setSchoolRegion] = useState('Addis Ababa');
  const [academicYear, setAcademicYear] = useState('2018 E.C.');
  const [calendarDays, setCalendarDays] = useState('220 days');

  // Security Credentials States
  const [adminEmail, setAdminEmail] = useState('semeneh.y@bolecommunity.edu.et');
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('Administrative school coordinates updated successfully.');
    setTimeout(() => setSettingsSuccess(''), 4000);
  };

  const handleSavePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currPassword) {
      setPasswordError('Please provide current password to verify administrative changes.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password confirmation coordinates do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password length must satisfy at least 6 characters.');
      return;
    }

    setPasswordSuccess('Security credentials and passwords updated successfully.');
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* General Settings */}
        <Card className="border-border/60">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base font-bold">General School Coordination</CardTitle>
            <CardDescription className="text-xs">Edit primary coordinates and school parameters visible on reports.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSaveSettingsSubmit} className="space-y-4">
              {settingsSuccess && (
                <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-md text-xxs font-bold animate-fade-in">
                  ✓ {settingsSuccess}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">School Name Identifier</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Principal In Charge</label>
                  <input
                    type="text"
                    value={schoolPrincipal}
                    onChange={(e) => setSchoolPrincipal(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Contact Phone Number</label>
                  <input
                    type="text"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xxs items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">MOE region branch</label>
                  <select
                    value={schoolRegion}
                    onChange={(e) => setSchoolRegion(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                  >
                    <option value="Addis Ababa">Addis Ababa</option>
                    <option value="Oromia">Oromia</option>
                    <option value="Amhara">Amhara</option>
                    <option value="Sidama">Sidama</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Classroom Learning Days</label>
                  <input
                    type="text"
                    value={calendarDays}
                    onChange={(e) => setCalendarDays(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" variant="organic" className="text-xs h-10 w-full mt-2 border-none font-bold">
                Save School Coordinates
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Password credentials settings */}
        <Card className="border-border/60">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base font-bold">Administrative Security</CardTitle>
            <CardDescription className="text-xs">Modify portal login email and replace security passwords.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSavePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold animate-fade-in">
                  ⚠ {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-md text-xxs font-bold animate-fade-in">
                  ✓ {passwordSuccess}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Administrative Email Login</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Current Administrative Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <Button type="submit" variant="organic" className="text-xs h-10 w-full mt-2 border-none font-bold">
                Change Security Password
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>

    </div>
  );
};

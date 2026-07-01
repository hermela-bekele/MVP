'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDemoTeacher } from '@/lib/teacherPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const TeacherSettingsTab: React.FC = () => {
  const { teachers, updateTeacher, addNotification } = useApp();
  const teacher = getDemoTeacher(teachers);

  const [name, setName] = useState(teacher.name);
  const [email, setEmail] = useState(teacher.email);
  const [phone, setPhone] = useState(teacher.phone);

  useEffect(() => {
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
  }, [teacher.id, teacher.name, teacher.email, teacher.phone]);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [language, setLanguage] = useState('English');

  const handlePersonalSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeacher(teacher.id, { name, email, phone });
  };

  const handleGeneralSave = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification('Preferences saved', 'General portal settings updated.', 'success');
  };

  return (
    <div className="space-y-6 text-left grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Personal profile</CardTitle>
          <CardDescription>Contact details visible to department head and parents.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePersonalSave} className="space-y-3">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <p className="text-xxs text-muted-foreground">
              Subjects: {teacher.subjects.join(', ')} · Grades: {teacher.grades.join(', ')}
            </p>
            <Button type="submit" variant="organic" size="sm" className="border-none">
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">General preferences</CardTitle>
          <CardDescription>Notifications and display options.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGeneralSave} className="space-y-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
              Email alerts for approvals and parent messages
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />
              SMS for urgent attendance alerts
            </label>
            <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Amharic">Amharic</option>
              <option value="Afaan Oromo">Afaan Oromo</option>
            </select>
            <Button type="submit" variant="organic" size="sm" className="border-none">
              Save preferences
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

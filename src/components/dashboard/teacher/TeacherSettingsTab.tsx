'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getDemoTeacher } from '@/lib/teacherPortal';
import { AisBtnPrimary, AisPage, aisInput } from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm, aisCard, aisHeadlineSm } from '@/components/dashboard/teacher/aisStyles';

export const TeacherSettingsTab: React.FC = () => {
  const { teachers, updateTeacher, addNotification, currentUser } = useApp();
  const teacher = getDemoTeacher(teachers, currentUser?.email, currentUser?.displayName);

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
    <AisPage className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className={`${aisCard} p-4`}>
        <div className="mb-4 border-b border-ais-card-border pb-3">
          <h3 className={aisHeadlineSm}>Personal profile</h3>
          <p className={`${aisBodyMd} mt-0.5`}>Contact details visible to department head and parents.</p>
        </div>
        <form onSubmit={handlePersonalSave} className="space-y-3">
          <input className={aisInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input className={aisInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className={aisInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <p className={aisBodySm}>
            Subjects: {teacher.subjects.join(', ')} · Grades: {teacher.grades.join(', ')}
          </p>
          <AisBtnPrimary type="submit">Save profile</AisBtnPrimary>
        </form>
      </div>

      <div className={`${aisCard} p-4`}>
        <div className="mb-4 border-b border-ais-card-border pb-3">
          <h3 className={aisHeadlineSm}>General preferences</h3>
          <p className={`${aisBodyMd} mt-0.5`}>Notifications and display options.</p>
        </div>
        <form onSubmit={handleGeneralSave} className="space-y-3">
          <label className={`flex cursor-pointer items-center gap-2 ${aisBodyMd}`}>
            <input type="checkbox" className="accent-ais-primary" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
            Email alerts for approvals and parent messages
          </label>
          <label className={`flex cursor-pointer items-center gap-2 ${aisBodyMd}`}>
            <input type="checkbox" className="accent-ais-primary" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />
            SMS for urgent attendance alerts
          </label>
          <select className={aisInput} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="English">English</option>
            <option value="Amharic">Amharic</option>
            <option value="Afaan Oromo">Afaan Oromo</option>
          </select>
          <AisBtnPrimary type="submit">Save preferences</AisBtnPrimary>
        </form>
      </div>
    </AisPage>
  );
};

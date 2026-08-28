'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getDemoTeacher } from '@/lib/teacherPortal';
import { getTeacherExperienceLevel } from '@/lib/mockData';
import { AisBtnPrimary, AisPage, aisInput } from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisBodySm, aisCard, aisHeadlineSm } from '@/components/dashboard/teacher/aisStyles';
import { PortalProfileCard } from '@/components/dashboard/shared/PortalProfileCard';

export const TeacherSettingsTab: React.FC = () => {
  const { teachers, updateTeacher, addNotification, currentUser } = useApp();
  const teacher = getDemoTeacher(teachers, currentUser?.email, currentUser?.displayName);
  const experienceLevel = getTeacherExperienceLevel(teacher);

  const [name, setName] = useState(teacher.name);
  const [email, setEmail] = useState(teacher.email);
  const [phone, setPhone] = useState(teacher.phone);
  const [yearsOfExperience, setYearsOfExperience] = useState(teacher.yearsOfExperience ?? 0);

  useEffect(() => {
    setName(teacher.name);
    setEmail(teacher.email);
    setPhone(teacher.phone);
    setYearsOfExperience(teacher.yearsOfExperience ?? 0);
  }, [teacher.id, teacher.name, teacher.email, teacher.phone, teacher.yearsOfExperience]);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [language, setLanguage] = useState('English');

  const handlePersonalSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeacher(teacher.id, { name, email, phone, yearsOfExperience });
  };

  const handleGeneralSave = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification('Preferences saved', 'General portal settings updated.', 'success');
  };

  return (
    <AisPage className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <PortalProfileCard
        className="md:col-span-2"
        roleLabel="Teacher"
        fields={[
          { label: 'Subjects taught', value: teacher.subjects.join(', ') || '—' },
          { label: 'Grades', value: teacher.grades.join(', ') || '—' },
          { label: 'Certification', value: teacher.certification || '—' },
          {
            label: 'Experience track',
            value: (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                  experienceLevel === 'new' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {experienceLevel === 'new' ? 'New teacher · TIP + STEP' : 'Experienced · STEP'}
              </span>
            ),
          },
        ]}
      />

      <div className={`${aisCard} p-4`}>
        <div className="mb-4 border-b border-ais-card-border pb-3">
          <h3 className={`${aisHeadlineSm} !text-title`}>Personal profile</h3>
          <p className={`${aisBodyMd} mt-0.5`}>Contact details visible to department head and parents.</p>
        </div>
        <form onSubmit={handlePersonalSave} className="space-y-3">
          <input className={aisInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input className={aisInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className={aisInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <div>
            <label className={`${aisBodySm} mb-1 block`}>Years of teaching experience</label>
            <input
              className={aisInput}
              type="number"
              min={0}
              max={50}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(Number(e.target.value))}
            />
          </div>
          <p className={aisBodySm}>
            Subjects: {teacher.subjects.join(', ')} · Grades: {teacher.grades.join(', ')}
          </p>
          <AisBtnPrimary type="submit">Save profile</AisBtnPrimary>
        </form>
      </div>

      <div className={`${aisCard} p-4`}>
        <div className="mb-4 border-b border-ais-card-border pb-3">
          <h3 className={`${aisHeadlineSm} !text-title`}>General preferences</h3>
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

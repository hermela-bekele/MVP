'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { Button } from '@/components/ui/button';
import { REGISTRAR_GRADE_OPTIONS, REGISTRAR_SECTION_OPTIONS } from '@/lib/registrarPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const RegistrarEnrollment: React.FC = () => {
  const { enrollStudent } = useApp();

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentGrade, setStudentGrade] = useState('Grade 9');
  const [studentSection, setStudentSection] = useState('A');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastEnrolled, setLastEnrolled] = useState({ grade: '', section: '' });

  useEffect(() => {
    const handleOpen = () => setSubmitted(false);
    window.addEventListener('open-registrar-enroll', handleOpen);
    return () => window.removeEventListener('open-registrar-enroll', handleOpen);
  }, []);

  const resetForm = () => {
    setStudentName('');
    setStudentEmail('');
    setStudentGrade('Grade 9');
    setStudentSection('A');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setEmergencyContact('');
    setMedicalInfo('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !parentName || !parentPhone) return;

    setLastEnrolled({ grade: studentGrade, section: studentSection });

    enrollStudent({
      name: studentName,
      email: studentEmail || undefined,
      grade: studentGrade,
      section: studentSection,
      parentName,
      parentPhone,
      parentEmail,
      emergencyContact,
      medicalInfo: medicalInfo || undefined,
      schoolId: 'sch-1',
    });

    setSubmitted(true);
    resetForm();
  };

  if (submitted) {
    return (
      <ContentCard
        title="Enrollment Complete"
        description="The student has been registered and assigned a PTS student ID."
      >
        <div className="text-center py-8 space-y-4">
          <div className="text-4xl">✓</div>
          <p className="text-sm text-foreground font-medium">
            Student successfully enrolled in {lastEnrolled.grade} Section {lastEnrolled.section}.
          </p>
          <p className="text-xs text-muted-foreground">
            A PTS student ID was auto-generated. The student record is now active in the registry.
          </p>
          <Button
            variant="organic"
            size="sm"
            onClick={() => setSubmitted(false)}
            className="text-xs h-9 border-none"
          >
            Enroll Another Student
          </Button>
        </div>
      </ContentCard>
    );
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <ContentCard
        title="Direct Student Enrollment"
        description="Register and onboard a new student directly — bypassing the application queue"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Student Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Almaz Kebede"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Student Email (Optional)</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. student@std.edu.et"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Grade Level</label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className={inputClass}
                >
                  {REGISTRAR_GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Section</label>
                <select
                  value={studentSection}
                  onChange={(e) => setStudentSection(e.target.value)}
                  className={inputClass}
                >
                  {REGISTRAR_SECTION_OPTIONS.map((s) => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-border/30" />

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">Parent / Guardian</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Guardian Name</label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</label>
                <input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <hr className="border-border/30" />

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Additional Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Emergency Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Medical Info</label>
                <input
                  type="text"
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                  className={inputClass}
                  placeholder="Allergies, conditions, etc."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="organic" size="sm" className="text-xs h-10 border-none font-semibold px-6">
              Complete Enrollment & Onboarding
            </Button>
          </div>
        </form>
      </ContentCard>
    </div>
  );
};

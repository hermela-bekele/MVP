'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  AisBtnPrimary,
  AisBtnSecondary,
  AisPage,
  AisPanel,
  AisStatusBadge,
  AisTable,
  AisTd,
  AisTh,
  AisTr,
  aisTextarea,
} from '@/components/dashboard/teacher/TeacherPortalUi';
import { aisBodyMd, aisCard, aisDataMd } from '@/components/dashboard/teacher/aisStyles';

export const TeacherCheckinsTab: React.FC = () => {
  const { teacherCheckInPrompts, respondToTeacherCheckIn } = useApp();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleSubmit = (id: string) => {
    const text = responses[id]?.trim();
    if (!text) return;
    respondToTeacherCheckIn(id, text);
    setActiveId(null);
    setResponses((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <AisPage>
      <AisPanel title="Wellness & feedback check-ins" description="Respond to surveys assigned to instructional staff" flush>
        <AisTable>
          <thead>
            <tr className="bg-ais-surface-container-low">
              <AisTh>Survey</AisTh>
              <AisTh>Type</AisTh>
              <AisTh>Due date</AisTh>
              <AisTh>Your response</AisTh>
              <AisTh>Action</AisTh>
            </tr>
          </thead>
          <tbody>
            {teacherCheckInPrompts.map((p) => (
              <AisTr key={p.id}>
                <AisTd className="font-semibold">{p.title}</AisTd>
                <AisTd>
                  <AisStatusBadge variant="primary">{p.type}</AisStatusBadge>
                </AisTd>
                <AisTd className={aisBodyMd}>{p.dueDate}</AisTd>
                <AisTd className="max-w-sm text-xs">
                  {p.teacherResponse ? (
                    <span className="text-ais-on-surface">{p.teacherResponse}</span>
                  ) : (
                    <span className="italic text-ais-on-surface-variant">Not submitted</span>
                  )}
                </AisTd>
                <AisTd>
                  <AisBtnSecondary className="!px-2.5 !py-1" onClick={() => setActiveId(p.id)}>
                    {p.teacherResponse ? 'Update' : 'Respond'}
                  </AisBtnSecondary>
                </AisTd>
              </AisTr>
            ))}
          </tbody>
        </AisTable>
      </AisPanel>

      {activeId && (
        <div className={`${aisCard} space-y-3 p-4`}>
          <p className={aisDataMd}>
            Response: {teacherCheckInPrompts.find((p) => p.id === activeId)?.title}
          </p>
          <textarea
            className={aisTextarea}
            value={responses[activeId] ?? teacherCheckInPrompts.find((p) => p.id === activeId)?.teacherResponse ?? ''}
            onChange={(e) => setResponses({ ...responses, [activeId]: e.target.value })}
            placeholder="Enter your reflective response..."
          />
          <div className="flex justify-end gap-2">
            <AisBtnSecondary onClick={() => setActiveId(null)}>Cancel</AisBtnSecondary>
            <AisBtnPrimary onClick={() => handleSubmit(activeId)}>Submit response</AisBtnPrimary>
          </div>
        </div>
      )}
    </AisPage>
  );
};

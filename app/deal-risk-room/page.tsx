'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const sample = JSON.stringify({
  opportunity: { name: 'Enterprise renewal', amount: 240000, stageAge: 31, probability: 42 },
  blockers: ['no legal owner', 'missing economic buyer']
}, null, 2);

export default function DealRiskRoomPage() {
  const [payload, setPayload] = useState(sample);
  const [result, setResult] = useState<any>(null);

  async function run() {
    const response = await fetch('/api/deal-risk-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    setResult(await response.json());
  }

  return (
    <DashboardLayout>
      <div style={{ padding: 24 }}>
        <h1>Deal Risk Room</h1>
        <p>Escalate stuck opportunities into a focused manager action room.</p>
        <textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={12} style={{ width: '100%', fontFamily: 'monospace' }} />
        <button onClick={run}>Score deal risk</button>
        {result && (
          <section>
            <h2>{result.opportunity}: {result.risk}/100 ({result.roomMode})</h2>
            <ul>{result.actions.map((item: string) => <li key={item}>{item}</li>)}</ul>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

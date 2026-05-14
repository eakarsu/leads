// === Batch 11 Gaps & Frontend Mounts ===
'use client';
import GapFeaturePage from '@/components/GapFeaturePage';
export default function GapVisionDocOcrPage() {
  return (
    <GapFeaturePage
      title="Vision-Based Document/Contract OCR"
      description="Vision-Based Document/Contract OCR"
      slug="vision-doc-ocr"
      aiResultKey="extraction"
      fields={[{"name":"content","label":"Doc Content","type":"textarea","rows":4,"required":true}]}
    />
  );
}

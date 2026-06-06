import { StickyNote } from "lucide-react";
import { SectionLabel } from "./CourierOrderDetailSheet";

function NoteBox({ text }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5">
      <StickyNote className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <p className="text-sm italic text-muted-foreground">"{text}"</p>
    </div>
  );
}

export function CourierOrderNotes({ customerNotes, addressNotes }) {
  const showAddress = addressNotes && addressNotes !== customerNotes;
  if (!customerNotes && !showAddress) return null;

  return (
    <div className="px-5 py-4 space-y-2">
      <SectionLabel>Notes</SectionLabel>
      {customerNotes && <NoteBox text={customerNotes} />}
      {showAddress && <NoteBox text={addressNotes} />}
    </div>
  );
}

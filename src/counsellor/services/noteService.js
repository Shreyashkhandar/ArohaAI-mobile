/**
 * Note Service for Counsellors.
 * Formats detailed confidential case notes with metadata for counsellor review.
 */

export function formatDetailedNote({
  interactionDate = new Date().toLocaleDateString(),
  interactionType = 'In-person Session',
  observation = '',
  actionTaken = '',
  followUpRequired = false,
  nextFollowUpDate = '',
  authorName = 'Counsellor',
}) {
  const timeStr = new Date().toLocaleString();
  return [
    `[Interaction Note - ${interactionDate}]`,
    `Timestamp: ${timeStr}`,
    `Type: ${interactionType}`,
    `Recorded By: ${authorName}`,
    `Observation: ${observation.trim()}`,
    actionTaken && actionTaken.trim() ? `Action Taken: ${actionTaken.trim()}` : null,
    `Follow-up Required: ${followUpRequired ? 'Yes' : 'No'}`,
    nextFollowUpDate && nextFollowUpDate.trim() ? `Next Follow-up Date: ${nextFollowUpDate.trim()}` : null,
  ].filter(Boolean).join('\n');
}

export function formatNoteEntry(noteText, authorName = 'Counsellor') {
  if (!noteText || !noteText.trim()) return '';
  const nowStr = new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `[${nowStr} - ${authorName}]\n${noteText.trim()}`;
}

export function appendNoteToHistory(existingNotes = '', newNoteText = '', authorName = 'Counsellor') {
  if (!newNoteText || !newNoteText.trim()) return existingNotes;
  if (!existingNotes || !existingNotes.trim()) return newNoteText.trim();
  return `${newNoteText.trim()}\n\n-------------------------\n\n${existingNotes}`;
}

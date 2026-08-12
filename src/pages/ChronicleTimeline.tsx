import React from 'react';
import ChronicleEventCard, { TimelineEvent } from '../components/chronicle/ChronicleEventCard';

export default function ChronicleTimeline() {
  const events: TimelineEvent[] = [
    // ... keep your array here
  ];

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <ChronicleEventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
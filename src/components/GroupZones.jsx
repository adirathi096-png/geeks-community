import React from 'react';
import GroupCard from './GroupCard';

export default function GroupZones({ zones, onPreselectGroup }) {
  return (
    <section id="groups" className="section-shell">
      <div className="section-heading">
        <span>Community Groups</span>
        <h2>Explore every zone</h2>
        <p>Every group supports student posts and direct WhatsApp link management.</p>
      </div>

      {zones.map((zone) => (
        <div className="zone-block" key={zone.zone}>
          <h3 className="zone-title">{zone.emoji} {zone.zone}</h3>
          <div className="cards-grid">
            {zone.groups.map((group) => (
              <GroupCard
                key={group.name}
                group={group}
                zone={zone.zone}
                onPreselectGroup={onPreselectGroup}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

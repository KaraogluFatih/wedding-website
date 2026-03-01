"use client";

import { useState, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface ScheduleItem {
  _id: string;
  order: number;
  time: string;
  event: string;
  emoji: string;
  isBreak: boolean;
}

interface Venue {
  _id: string;
  order: number;
  name: string;
  subtitle: string;
  address: string;
  city: string;
  mapsUrl: string;
  embedUrl: string;
}

interface MenuItem {
  _id: string;
  type: "food" | "drink";
  category: string;
  id: string;
  name: string;
  description: string;
  order: number;
}

interface Guest {
  _id: string;
  name: string;
  family: string;
  order: number;
}

interface Seating {
  bride: string;
  groom: string;
  bridesSide: string[];
  groomsSide: string[];
}

// ── Shared helpers ─────────────────────────────────────────────────────────
function adminHeaders(pw: string) {
  return { "Content-Type": "application/json", "x-admin-password": pw };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ScheduleTab({ pw }: { pw: string }) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<ScheduleItem>>({});
  const [newItem, setNewItem] = useState({ time: "", event: "", emoji: "📅", isBreak: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/schedule").then(r => r.json()).then(setItems);
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: adminHeaders(pw),
      body: JSON.stringify({ _id: editId, ...editBuf }),
    });
    const fresh = await fetch("/api/admin/schedule").then(r => r.json());
    setItems(fresh);
    setEditId(null);
    setSaving(false);
  }

  async function add() {
    if (!newItem.event.trim()) return;
    setSaving(true);
    await fetch("/api/admin/schedule", {
      method: "POST",
      headers: adminHeaders(pw),
      body: JSON.stringify(newItem),
    });
    const fresh = await fetch("/api/admin/schedule").then(r => r.json());
    setItems(fresh);
    setNewItem({ time: "", event: "", emoji: "📅", isBreak: false });
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Eintrag löschen?")) return;
    await fetch(`/api/admin/schedule?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": pw },
    });
    setItems(items.filter(i => i._id.toString() !== id));
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((item, i) => ({ ...item, order: i }));
    setItems(reordered);
    await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: adminHeaders(pw),
      body: JSON.stringify({ items: reordered.map(i => ({ _id: i._id, order: i.order })) }),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="font-playfair text-2xl" style={{ color: "#d4a5a5" }}>Zeitplan</h2>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item._id.toString()} className="bg-white rounded-xl shadow-sm p-4 flex gap-3 items-start">
            <div className="flex flex-col gap-1 pt-1">
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-xs px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">▲</button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="text-xs px-1 py-0.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">▼</button>
            </div>
            {editId === item._id.toString() ? (
              <div className="flex-1 grid grid-cols-1 gap-2">
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="Zeit" value={editBuf.time ?? item.time} onChange={e => setEditBuf(b => ({ ...b, time: e.target.value }))} style={{ width: 90 }} />
                  <input className={inputCls} placeholder="Emoji" value={editBuf.emoji ?? item.emoji} onChange={e => setEditBuf(b => ({ ...b, emoji: e.target.value }))} style={{ width: 60 }} />
                  <label className="flex items-center gap-1 text-sm" style={{ color: "#c08b8b" }}>
                    <input type="checkbox" checked={editBuf.isBreak ?? item.isBreak} onChange={e => setEditBuf(b => ({ ...b, isBreak: e.target.checked }))} />
                    Pause
                  </label>
                </div>
                <input className={inputCls} placeholder="Ereignis" value={editBuf.event ?? item.event} onChange={e => setEditBuf(b => ({ ...b, event: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={save} disabled={saving} className={btnPrimary}>Speichern</button>
                  <button onClick={() => setEditId(null)} className={btnSecondary}>Abbrechen</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm" style={{ color: "#b8956b" }}>{item.time || "—"}</span>
                  {item.isBreak && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Pause</span>}
                  <p className="text-sm" style={{ color: "#4a4a4a" }}>{item.event}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(item._id.toString()); setEditBuf({}); }} className={btnSecondary}>Bearbeiten</button>
                  <button onClick={() => remove(item._id.toString())} className={btnDanger}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#c08b8b" }}>Neuer Eintrag</p>
        <div className="flex gap-2 flex-wrap">
          <input className={inputCls} placeholder="Zeit z.B. 14:00" value={newItem.time} onChange={e => setNewItem(n => ({ ...n, time: e.target.value }))} style={{ width: 110 }} />
          <input className={inputCls} placeholder="Emoji" value={newItem.emoji} onChange={e => setNewItem(n => ({ ...n, emoji: e.target.value }))} style={{ width: 70 }} />
          <label className="flex items-center gap-1 text-sm" style={{ color: "#c08b8b" }}>
            <input type="checkbox" checked={newItem.isBreak} onChange={e => setNewItem(n => ({ ...n, isBreak: e.target.checked }))} />
            Pause
          </label>
        </div>
        <input className={`${inputCls} mt-2 w-full`} placeholder="Ereignisbeschreibung" value={newItem.event} onChange={e => setNewItem(n => ({ ...n, event: e.target.value }))} />
        <button onClick={add} disabled={saving} className={`${btnPrimary} mt-3`}>+ Hinzufügen</button>
      </div>
    </div>
  );
}

function VenuesTab({ pw }: { pw: string }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<Venue>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/venues").then(r => r.json()).then(setVenues);
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/venues", {
      method: "PUT",
      headers: adminHeaders(pw),
      body: JSON.stringify({ _id: editId, ...editBuf }),
    });
    const fresh = await fetch("/api/admin/venues").then(r => r.json());
    setVenues(fresh);
    setEditId(null);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-playfair text-2xl" style={{ color: "#d4a5a5" }}>Veranstaltungsorte</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {venues.map(venue => (
          <div key={venue._id.toString()} className="bg-white rounded-xl shadow-sm p-5">
            {editId === venue._id.toString() ? (
              <div className="space-y-2">
                {(["name", "subtitle", "address", "city", "mapsUrl", "embedUrl"] as const).map(field => (
                  <div key={field}>
                    <label className="block font-cormorant text-xs uppercase tracking-wider mb-1" style={{ color: "#c08b8b" }}>{field}</label>
                    <input
                      className={`${inputCls} w-full`}
                      value={(editBuf[field] ?? venue[field]) as string}
                      onChange={e => setEditBuf(b => ({ ...b, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button onClick={save} disabled={saving} className={btnPrimary}>Speichern</button>
                  <button onClick={() => setEditId(null)} className={btnSecondary}>Abbrechen</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-cormorant text-xs uppercase tracking-wider mb-1" style={{ color: "#c08b8b" }}>{venue.subtitle}</p>
                <p className="font-playfair text-lg mb-1" style={{ color: "#4a4a4a" }}>{venue.name}</p>
                <p className="text-sm" style={{ color: "#7a7a7a" }}>{venue.address}</p>
                <p className="text-sm mb-3" style={{ color: "#7a7a7a" }}>{venue.city}</p>
                <button onClick={() => { setEditId(venue._id.toString()); setEditBuf({}); }} className={btnSecondary}>Bearbeiten</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuTab({ pw }: { pw: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<"food" | "drink">("food");
  const [editId, setEditId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<MenuItem>>({});
  const [newItem, setNewItem] = useState({ type: "food" as "food" | "drink", category: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/menu").then(r => r.json()).then(setItems);
  }, []);

  const refresh = () => fetch("/api/admin/menu").then(r => r.json()).then(setItems);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/menu", {
      method: "PUT",
      headers: adminHeaders(pw),
      body: JSON.stringify({ _id: editId, ...editBuf }),
    });
    await refresh();
    setEditId(null);
    setSaving(false);
  }

  async function add() {
    if (!newItem.name.trim() || !newItem.category.trim()) return;
    setSaving(true);
    await fetch("/api/admin/menu", {
      method: "POST",
      headers: adminHeaders(pw),
      body: JSON.stringify({ ...newItem, type: typeFilter }),
    });
    await refresh();
    setNewItem(n => ({ ...n, category: "", name: "", description: "" }));
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Menüeintrag löschen? Bestehende Bestellungen werden nicht gelöscht.")) return;
    await fetch(`/api/admin/menu?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": pw },
    });
    setItems(items.filter(i => i._id.toString() !== id));
  }

  const filtered = items.filter(i => i.type === typeFilter);
  const categories = [...new Set(filtered.map(i => i.category))];

  return (
    <div className="space-y-4">
      <h2 className="font-playfair text-2xl" style={{ color: "#d4a5a5" }}>Speisen & Getränke</h2>

      {/* Type toggle */}
      <div className="flex gap-2">
        {(["food", "drink"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${typeFilter === t ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
            style={typeFilter === t ? { backgroundColor: "#d4a5a5" } : {}}
          >
            {t === "food" ? "🍽 Speisen" : "🥂 Getränke"}
          </button>
        ))}
      </div>

      {/* Items grouped by category */}
      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat} className="bg-white rounded-xl shadow-sm p-4">
            <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#b8956b" }}>{cat}</p>
            <div className="space-y-2">
              {filtered.filter(i => i.category === cat).map(item => (
                <div key={item._id.toString()} className="border border-gray-100 rounded-lg p-3">
                  {editId === item._id.toString() ? (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 font-mono" style={{ color: "#7a7a7a" }}>id: {item.id}</span>
                      </div>
                      <input className={`${inputCls} w-full`} placeholder="Kategorie" value={editBuf.category ?? item.category} onChange={e => setEditBuf(b => ({ ...b, category: e.target.value }))} />
                      <input className={`${inputCls} w-full`} placeholder="Name" value={editBuf.name ?? item.name} onChange={e => setEditBuf(b => ({ ...b, name: e.target.value }))} />
                      <input className={`${inputCls} w-full`} placeholder="Beschreibung" value={editBuf.description ?? item.description} onChange={e => setEditBuf(b => ({ ...b, description: e.target.value }))} />
                      <div className="flex gap-2">
                        <button onClick={save} disabled={saving} className={btnPrimary}>Speichern</button>
                        <button onClick={() => setEditId(null)} className={btnSecondary}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm" style={{ color: "#4a4a4a" }}>{item.name}</p>
                        <p className="text-xs" style={{ color: "#9a9a9a" }}>{item.description}</p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: "#c0c0c0" }}>id: {item.id}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditId(item._id.toString()); setEditBuf({}); }} className={btnSecondary}>Bearbeiten</button>
                        <button onClick={() => remove(item._id.toString())} className={btnDanger}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#c08b8b" }}>Neuer Eintrag ({typeFilter === "food" ? "Speise" : "Getränk"})</p>
        <div className="space-y-2">
          <input className={`${inputCls} w-full`} placeholder="Kategorie" value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))} />
          <input className={`${inputCls} w-full`} placeholder="Name" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
          <input className={`${inputCls} w-full`} placeholder="Beschreibung" value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} />
          <button onClick={add} disabled={saving} className={btnPrimary}>+ Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

function GuestsTab({ pw }: { pw: string }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<Guest>>({});
  const [newGuest, setNewGuest] = useState({ name: "", family: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/guests").then(r => r.json()).then(setGuests);
  }, []);

  const refresh = () => fetch("/api/admin/guests").then(r => r.json()).then(setGuests);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/guests", {
      method: "PUT",
      headers: adminHeaders(pw),
      body: JSON.stringify({ _id: editId, ...editBuf }),
    });
    await refresh();
    setEditId(null);
    setSaving(false);
  }

  async function add() {
    if (!newGuest.name.trim() || !newGuest.family.trim()) return;
    setSaving(true);
    await fetch("/api/admin/guests", {
      method: "POST",
      headers: adminHeaders(pw),
      body: JSON.stringify(newGuest),
    });
    await refresh();
    setNewGuest({ name: "", family: "" });
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Gast löschen? Bitte zuerst aus der Sitzordnung entfernen.")) return;
    await fetch(`/api/admin/guests?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": pw },
    });
    setGuests(guests.filter(g => g._id.toString() !== id));
  }

  const families = [...new Set(guests.map(g => g.family))];

  return (
    <div className="space-y-4">
      <h2 className="font-playfair text-2xl" style={{ color: "#d4a5a5" }}>Gästeliste</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {families.map(family => (
          <div key={family} className="bg-white rounded-xl shadow-sm p-4">
            <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#b8956b" }}>Familie {family}</p>
            <div className="space-y-2">
              {guests.filter(g => g.family === family).map(guest => (
                <div key={guest._id.toString()} className="border border-gray-100 rounded-lg p-2">
                  {editId === guest._id.toString() ? (
                    <div className="space-y-2">
                      <input className={`${inputCls} w-full`} placeholder="Name" value={editBuf.name ?? guest.name} onChange={e => setEditBuf(b => ({ ...b, name: e.target.value }))} />
                      <input className={`${inputCls} w-full`} placeholder="Familie" value={editBuf.family ?? guest.family} onChange={e => setEditBuf(b => ({ ...b, family: e.target.value }))} />
                      <div className="flex gap-2">
                        <button onClick={save} disabled={saving} className={btnPrimary}>Speichern</button>
                        <button onClick={() => setEditId(null)} className={btnSecondary}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm" style={{ color: "#4a4a4a" }}>{guest.name}</span>
                      <button onClick={() => { setEditId(guest._id.toString()); setEditBuf({}); }} className={btnSecondary}>Bearbeiten</button>
                      <button onClick={() => remove(guest._id.toString())} className={btnDanger}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#c08b8b" }}>Neuer Gast</p>
        <div className="flex gap-2 flex-wrap">
          <input className={inputCls} placeholder="Vollständiger Name" value={newGuest.name} onChange={e => setNewGuest(n => ({ ...n, name: e.target.value }))} style={{ minWidth: 180 }} />
          <input className={inputCls} placeholder="Familie" value={newGuest.family} onChange={e => setNewGuest(n => ({ ...n, family: e.target.value }))} style={{ minWidth: 130 }} />
          <button onClick={add} disabled={saving} className={btnPrimary}>+ Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

function SeatingTab({ pw }: { pw: string }) {
  const [seating, setSeating] = useState<Seating>({ bride: "", groom: "", bridesSide: [], groomsSide: [] });
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/seating").then(r => r.json()),
      fetch("/api/admin/guests").then(r => r.json()),
    ]).then(([s, g]) => {
      setSeating(s);
      setAllGuests(g);
    });
  }, []);

  const guestNames = allGuests.map(g => g.name);
  const assigned = new Set([seating.bride, seating.groom, ...seating.bridesSide, ...seating.groomsSide]);
  const pool = guestNames.filter(n => !assigned.has(n));

  function addTo(side: "bridesSide" | "groomsSide", name: string) {
    setSeating(s => ({ ...s, [side]: [...s[side], name] }));
  }

  function removeFrom(side: "bridesSide" | "groomsSide", name: string) {
    setSeating(s => ({ ...s, [side]: s[side].filter(n => n !== name) }));
  }

  function moveInSide(side: "bridesSide" | "groomsSide", index: number, dir: -1 | 1) {
    const arr = [...seating[side]];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setSeating(s => ({ ...s, [side]: arr }));
  }

  async function saveSaving() {
    setSaving(true);
    await fetch("/api/admin/seating", {
      method: "PUT",
      headers: adminHeaders(pw),
      body: JSON.stringify(seating),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-playfair text-2xl" style={{ color: "#d4a5a5" }}>Sitzordnung</h2>

      {/* Bride & Groom */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4 flex-wrap">
        <div>
          <label className="block font-cormorant text-xs uppercase tracking-wider mb-1" style={{ color: "#c08b8b" }}>Braut</label>
          <select className={inputCls} value={seating.bride} onChange={e => setSeating(s => ({ ...s, bride: e.target.value }))}>
            <option value="">— wählen —</option>
            {guestNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-cormorant text-xs uppercase tracking-wider mb-1" style={{ color: "#c08b8b" }}>Bräutigam</label>
          <select className={inputCls} value={seating.groom} onChange={e => setSeating(s => ({ ...s, groom: e.target.value }))}>
            <option value="">— wählen —</option>
            {guestNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pool */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#c08b8b" }}>Nicht zugewiesen ({pool.length})</p>
          <div className="space-y-2">
            {pool.map(name => (
              <div key={name} className="border border-gray-100 rounded-lg p-2 text-sm flex gap-2 items-center">
                <span className="flex-1" style={{ color: "#4a4a4a" }}>{name}</span>
                <button onClick={() => addTo("bridesSide", name)} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#f0d4d4", color: "#c08b8b" }}>→ Braut</button>
                <button onClick={() => addTo("groomsSide", name)} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#d4e0f0", color: "#6b8bc0" }}>→ Bräutigam</button>
              </div>
            ))}
            {pool.length === 0 && <p className="text-xs text-gray-400">Alle Gäste zugewiesen</p>}
          </div>
        </div>

        {/* Bride's side */}
        <div className="bg-white rounded-xl shadow-sm p-4" style={{ borderTop: "3px solid #d4a5a5" }}>
          <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#c08b8b" }}>Seite der Braut</p>
          <div className="space-y-2">
            {seating.bridesSide.map((name, idx) => (
              <div key={name} className="border border-gray-100 rounded-lg p-2 text-sm flex gap-1 items-center">
                <div className="flex flex-col mr-1">
                  <button onClick={() => moveInSide("bridesSide", idx, -1)} disabled={idx === 0} className="text-xs leading-none disabled:opacity-30">▲</button>
                  <button onClick={() => moveInSide("bridesSide", idx, 1)} disabled={idx === seating.bridesSide.length - 1} className="text-xs leading-none disabled:opacity-30">▼</button>
                </div>
                <span className="flex-1" style={{ color: "#4a4a4a" }}>{name}</span>
                <button onClick={() => removeFrom("bridesSide", name)} className={btnDanger}>✕</button>
              </div>
            ))}
            {seating.bridesSide.length === 0 && <p className="text-xs text-gray-400">Keine Gäste zugewiesen</p>}
          </div>
        </div>

        {/* Groom's side */}
        <div className="bg-white rounded-xl shadow-sm p-4" style={{ borderTop: "3px solid #a5b4d4" }}>
          <p className="font-cormorant text-xs uppercase tracking-wider mb-3" style={{ color: "#6b8bc0" }}>Seite des Bräutigams</p>
          <div className="space-y-2">
            {seating.groomsSide.map((name, idx) => (
              <div key={name} className="border border-gray-100 rounded-lg p-2 text-sm flex gap-1 items-center">
                <div className="flex flex-col mr-1">
                  <button onClick={() => moveInSide("groomsSide", idx, -1)} disabled={idx === 0} className="text-xs leading-none disabled:opacity-30">▲</button>
                  <button onClick={() => moveInSide("groomsSide", idx, 1)} disabled={idx === seating.groomsSide.length - 1} className="text-xs leading-none disabled:opacity-30">▼</button>
                </div>
                <span className="flex-1" style={{ color: "#4a4a4a" }}>{name}</span>
                <button onClick={() => removeFrom("groomsSide", name)} className={btnDanger}>✕</button>
              </div>
            ))}
            {seating.groomsSide.length === 0 && <p className="text-xs text-gray-400">Keine Gäste zugewiesen</p>}
          </div>
        </div>
      </div>

      <button onClick={saveSaving} disabled={saving} className={`${btnPrimary} text-base px-8 py-3`}>
        {saved ? "✓ Gespeichert!" : saving ? "Speichere..." : "Sitzordnung speichern"}
      </button>
    </div>
  );
}

function SeedTab({ pw }: { pw: string }) {
  const [result, setResult] = useState<{ seeded?: string[]; skipped?: string[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function seed() {
    if (!confirm("Initiale Daten in die Datenbank einspielen? (Nur für leere Sammlungen)")) return;
    setLoading(true);
    const res = await fetch("/api/admin/seed", {
      method: "POST",
      headers: { "x-admin-password": pw },
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-playfair text-2xl" style={{ color: "#d4a5a5" }}>Datenbank befüllen</h2>
      <div className="bg-white rounded-xl shadow-sm p-5 max-w-lg">
        <p className="text-sm mb-4" style={{ color: "#4a4a4a" }}>
          Spielt die ursprünglichen Standarddaten in leere Sammlungen ein. Bereits vorhandene Daten werden nicht überschrieben.
        </p>
        <button onClick={seed} disabled={loading} className={`${btnPrimary} text-base px-8 py-3`}>
          {loading ? "Wird eingelesen..." : "Initialdaten einspielen"}
        </button>
        {result && (
          <div className="mt-4 text-sm space-y-1">
            {result.error && <p className="text-red-500">{result.error}</p>}
            {result.seeded && result.seeded.length > 0 && (
              <p style={{ color: "#6b8bc0" }}>✓ Befüllt: {result.seeded.join(", ")}</p>
            )}
            {result.skipped && result.skipped.length > 0 && (
              <p style={{ color: "#9a9a9a" }}>— Übersprungen (nicht leer): {result.skipped.join(", ")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Orders overview + Excel export ────────────────────────────────────────
interface OrderRow {
  guest_name: string;
  main_course: string | null;
  drink: string | null;
  updated_at?: string;
}

function OrdersTab({ pw }: { pw: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/admin/guests").then(r => r.json()),
    ]).then(([o, g]) => {
      setOrders(Array.isArray(o) ? o : []);
      setGuests(Array.isArray(g) ? g : []);
      setLoading(false);
    });
  }, []);

  function refresh() {
    setLoading(true);
    fetch("/api/orders").then(r => r.json()).then(o => {
      setOrders(Array.isArray(o) ? o : []);
      setLoading(false);
    });
  }

  function exportExcel() {
    const allRows = guests.map(g => {
      const order = orders.find(o => o.guest_name === g.name);
      return {
        Name: g.name,
        Familie: g.family,
        Hauptspeise: order?.main_course || "–",
        Getränk: order?.drink || "–",
        "Bestellt am": order?.updated_at
          ? new Date(order.updated_at).toLocaleDateString("de-DE")
          : "–",
      };
    });

    const headers = ["Name", "Familie", "Hauptspeise", "Getränk", "Bestellt am"];
    const rows = allRows.map(r => headers.map(h => (r as Record<string, string>)[h]));
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `hochzeit-bestellungen-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  const orderedNames = new Set(orders.map(o => o.guest_name));
  const orderedCount = guests.filter(g => orderedNames.has(g.name)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-playfair text-2xl" style={{ color: "#d4a5a5" }}>Bestellungen</h2>
          <p className="font-cormorant text-sm mt-0.5" style={{ color: "#9a9a9a" }}>
            {orderedCount} von {guests.length} Gästen haben bestellt
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className={btnSecondary}>↻ Aktualisieren</button>
          <button onClick={exportExcel} className={btnPrimary}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel Export
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "#9a9a9a" }}>Lade Bestellungen…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ backgroundColor: "#fdf0f0" }}>
                <th className="text-left px-4 py-3 font-cormorant text-xs uppercase tracking-wider" style={{ color: "#c08b8b" }}>Name</th>
                <th className="text-left px-4 py-3 font-cormorant text-xs uppercase tracking-wider" style={{ color: "#c08b8b" }}>Familie</th>
                <th className="text-left px-4 py-3 font-cormorant text-xs uppercase tracking-wider" style={{ color: "#c08b8b" }}>Hauptspeise</th>
                <th className="text-left px-4 py-3 font-cormorant text-xs uppercase tracking-wider" style={{ color: "#c08b8b" }}>Getränk</th>
                <th className="text-left px-4 py-3 font-cormorant text-xs uppercase tracking-wider" style={{ color: "#c08b8b" }}>Bestellt am</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, idx) => {
                const order = orders.find(o => o.guest_name === guest.name);
                const hasOrder = !!order;
                return (
                  <tr
                    key={guest._id.toString()}
                    className="border-t"
                    style={{ borderColor: "#f5eded", backgroundColor: idx % 2 === 0 ? "#fff" : "#fffaf9" }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "#4a4a4a" }}>{guest.name}</td>
                    <td className="px-4 py-3" style={{ color: "#7a7a7a" }}>{guest.family}</td>
                    <td className="px-4 py-3" style={{ color: hasOrder ? "#4a4a4a" : "#c0c0c0" }}>
                      {order?.main_course || "–"}
                    </td>
                    <td className="px-4 py-3" style={{ color: hasOrder ? "#4a4a4a" : "#c0c0c0" }}>
                      {order?.drink || "–"}
                    </td>
                    <td className="px-4 py-3">
                      {hasOrder ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#e8f5e9", color: "#4caf50" }}>
                          {order.updated_at ? new Date(order.updated_at).toLocaleDateString("de-DE") : "✓"}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ffeaea", color: "#e57373" }}>
                          Ausstehend
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Shared style constants ──────────────────────────────────────────────────
const inputCls = "border border-[#e8c5c5] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#d4a5a5]";
const btnPrimary = "px-4 py-2 rounded-full text-sm font-medium text-white transition-colors disabled:opacity-60 bg-[#d4a5a5] hover:bg-[#c08b8b]";
const btnSecondary = "px-3 py-1.5 rounded-full text-sm border border-[#e8c5c5] text-[#c08b8b] hover:bg-[#fdf0f0] transition-colors";
const btnDanger = "px-2 py-1 rounded-full text-xs text-white bg-red-400 hover:bg-red-500 transition-colors";

// Converts a base64url VAPID public key to the Uint8Array the browser expects
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── Main admin page ────────────────────────────────────────────────────────
type Tab = "orders" | "schedule" | "venues" | "menu" | "guests" | "seating" | "seed";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authPw, setAuthPw] = useState(""); // kept in state for API headers
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [pushState, setPushState] = useState<'unsupported' | 'checking' | 'subscribed' | 'unsubscribed'>('checking');
  const [pushLogs, setPushLogs] = useState<string[]>([]);
  function pushLog(msg: string) {
    const line = `${new Date().toLocaleTimeString()} ${msg}`;
    console.log('[Push]', msg);
    setPushLogs(prev => [...prev.slice(-19), line]);
  }

  // Restore session flag (not the password itself)
  useEffect(() => {
    if (localStorage.getItem("wedding-admin-session") === "1") {
      // Still need the password for API calls — just pre-fill input
    }
  }, []);

  // Register service worker + check push subscription (only after auth)
  useEffect(() => {
    if (!authed) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported');
      return;
    }
    navigator.serviceWorker.register('/sw.js')
      .then(reg => reg.pushManager.getSubscription()
        .then(sub => setPushState(sub ? 'subscribed' : 'unsubscribed'))
      )
      .catch(() => setPushState('unsupported'));
  }, [authed]);

  async function togglePush() {
    try {
      pushLog(`togglePush called, state: ${pushState}`);
      const reg = await navigator.serviceWorker.ready;
      pushLog(`SW ready, scope: ${reg.scope}`);
      if (pushState === 'subscribed') {
        const sub = await reg.pushManager.getSubscription();
        pushLog(`Unsubscribing endpoint: ${sub?.endpoint ?? 'none'}`);
        await sub?.unsubscribe();
        await fetch('/api/admin/push/subscribe', {
          method: 'DELETE',
          headers: adminHeaders(authPw),
          body: JSON.stringify({ endpoint: sub?.endpoint }),
        });
        setPushState('unsubscribed');
        pushLog('Unsubscribed successfully');
      } else {
        pushLog(`Notification.permission: ${Notification.permission}`);
        if (Notification.permission === 'denied') {
          alert('Bitte Benachrichtigungen in den Browsereinstellungen erlauben.');
          return;
        }
        if (Notification.permission !== 'granted') {
          pushLog('Requesting permission...');
          const permission = await Notification.requestPermission();
          pushLog(`Permission result: ${permission}`);
          if (permission !== 'granted') {
            alert('Benachrichtigungen wurden nicht erlaubt.');
            return;
          }
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        pushLog(`VAPID key: ${vapidKey ? vapidKey.slice(0, 20) + '...' : 'MISSING'}`);
        if (!vapidKey) {
          alert('Push-Konfiguration fehlt (VAPID key).');
          return;
        }
        const existingSub = await reg.pushManager.getSubscription();
        pushLog(`Existing sub: ${existingSub ? existingSub.endpoint.slice(0, 40) + '...' : 'none'}`);
        if (existingSub) await existingSub.unsubscribe();
        pushLog('Calling pushManager.subscribe()...');
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
        });
        pushLog(`subscribe() result: ${sub ? sub.endpoint.slice(0, 40) + '...' : 'NULL'}`);
        if (!sub) {
          alert('Push-Abonnement konnte nicht erstellt werden. Bitte nochmal versuchen.');
          return;
        }
        pushLog('Saving to DB...');
        const saveRes = await fetch('/api/admin/push/subscribe', {
          method: 'POST',
          headers: adminHeaders(authPw),
          body: JSON.stringify(sub),
        });
        pushLog(`DB save status: ${saveRes.status}`);
        if (!saveRes.ok) {
          await sub.unsubscribe();
          alert('Abonnement konnte nicht in der Datenbank gespeichert werden. Bitte nochmal versuchen.');
          return;
        }
        setPushState('subscribed');
        pushLog('Subscribed successfully ✓');
      }
    } catch (err) {
      pushLog(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
      alert(`Push-Fehler: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function login() {
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) {
      setAuthed(true);
      setAuthPw(password);
      localStorage.setItem("wedding-admin-session", "1");
      setAuthError("");
    } else {
      setAuthError("Falsches Passwort");
    }
  }

  function logout() {
    setAuthed(false);
    setAuthPw("");
    setPassword("");
    localStorage.removeItem("wedding-admin-session");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "orders", label: "Bestellungen" },
    { id: "schedule", label: "Zeitplan" },
    { id: "venues", label: "Orte" },
    { id: "menu", label: "Menü" },
    { id: "guests", label: "Gäste" },
    { id: "seating", label: "Sitzordnung" },
    { id: "seed", label: "DB Setup" },
  ];

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fdfbfa" }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <p className="font-great-vibes text-4xl mb-1" style={{ color: "#d4a5a5" }}>Admin</p>
          <p className="font-cormorant text-xs uppercase tracking-widest mb-6" style={{ color: "#b8956b" }}>Lilly & Fatih</p>
          <input
            type="password"
            className={`${inputCls} w-full mb-3 text-center`}
            placeholder="Passwort"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ borderColor: "#e8c5c5" }}
          />
          {authError && <p className="text-red-400 text-sm mb-3">{authError}</p>}
          <button
            onClick={login}
            className={`${btnPrimary} w-full py-3`}
          >
            Anmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fdfbfa" }}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-great-vibes text-2xl" style={{ color: "#d4a5a5" }}>Admin</span>
            <span className="font-cormorant text-xs uppercase tracking-wider ml-3" style={{ color: "#b8956b" }}>Lilly & Fatih</span>
          </div>
          <div className="flex items-center gap-2">
            {pushState !== 'unsupported' && pushState !== 'checking' && (
              <>
                <button
                  onClick={togglePush}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${pushState === 'subscribed' ? 'text-white bg-[#d4a5a5] border-[#d4a5a5] hover:bg-[#c08b8b]' : 'border-[#e8c5c5] text-[#c08b8b] hover:bg-[#fdf0f0]'}`}
                  title={pushState === 'subscribed' ? 'Push deaktivieren' : 'Push aktivieren'}
                >
                  <span className="sm:hidden">{pushState === 'subscribed' ? '🔔' : '🔕'}</span>
                  <span className="hidden sm:inline">{pushState === 'subscribed' ? '🔔 Push aktiv' : '🔕 Push aktivieren'}</span>
                </button>
                {pushState === 'subscribed' && (
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/admin/push/test', { method: 'POST', headers: { 'x-admin-password': authPw } });
                      const data = await res.json();
                      if (!res.ok) {
                        alert(`Test fehlgeschlagen: ${data.error}`);
                      } else {
                        alert(`${data.count} Abonnement(e) in DB gefunden.\n${data.count > 0 ? 'Benachrichtigung gesendet!' : 'Kein Abonnement gespeichert – bitte nochmal "Push aktivieren" klicken.'}`);
                      }
                    }}
                    className={`${btnSecondary} text-xs`}
                    title="Test-Benachrichtigung senden"
                  >
                    Test
                  </button>
                )}
              </>
            )}
            <button onClick={logout} className={`${btnSecondary} text-xs`} style={{ borderColor: "#e8c5c5", color: "#c08b8b" }}>
              <span className="sm:hidden">✕</span>
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
        {/* Push debug log */}
        {pushLogs.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-2">
            <div className="bg-gray-900 text-green-400 text-xs font-mono rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">Push Debug Log</span>
                <button onClick={() => setPushLogs([])} className="text-gray-500 hover:text-white text-xs">clear</button>
              </div>
              {pushLogs.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          </div>
        )}
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-3 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
              style={activeTab === tab.id ? { backgroundColor: "#d4a5a5" } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "orders" && <OrdersTab pw={authPw} />}
        {activeTab === "schedule" && <ScheduleTab pw={authPw} />}
        {activeTab === "venues" && <VenuesTab pw={authPw} />}
        {activeTab === "menu" && <MenuTab pw={authPw} />}
        {activeTab === "guests" && <GuestsTab pw={authPw} />}
        {activeTab === "seating" && <SeatingTab pw={authPw} />}
        {activeTab === "seed" && <SeedTab pw={authPw} />}
      </main>
    </div>
  );
}

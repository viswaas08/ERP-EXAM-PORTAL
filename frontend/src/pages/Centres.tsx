import { MapPin, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button, Card, Input, Table } from "../components/ui";

const centres = ["Delhi North CBT Lab", "Pune Digital Campus", "Bengaluru South Centre", "Chennai Knowledge Park", "Jaipur Public School"];

export function Centres() {
  const [rows, setRows] = useState(centres.map((name, i) => ({ name, city: ["Delhi", "Pune", "Bengaluru", "Chennai", "Jaipur"][i], state: ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Rajasthan"][i], capacity: 250 + i * 70, systems: 220 + i * 65, allocated: 160 + i * 38 })));
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notice, setNotice] = useState("Centre allocation is ready.");

  function createCentre() {
    const next = { name: name || `New CBT Centre ${rows.length + 1}`, city: city || "New City", state: state || "New State", capacity: 240, systems: 220, allocated: 0 };
    setRows((current) => [next, ...current]);
    setName("");
    setCity("");
    setState("");
    setNotice(`${next.name} created with 240 seats.`);
  }

  function autoAllocate() {
    setRows((current) => current.map((row) => ({ ...row, allocated: Math.min(row.capacity, row.allocated + 25) })));
    setNotice("Auto allocation completed. Each centre received up to 25 additional candidates.");
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Examination Centre Management</h1><p className="text-sm text-slate-500">Manage centre capacity, labs, city, state, and candidate allocation.</p></div><Button onClick={autoAllocate}><Shuffle size={18} /> Auto Allocate</Button></div>
      <Card className="grid gap-3 md:grid-cols-4"><Input placeholder="Centre name" value={name} onChange={(event) => setName(event.target.value)} /><Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} /><Input placeholder="State" value={state} onChange={(event) => setState(event.target.value)} /><Button className="bg-secondary" onClick={createCentre}>Create Centre</Button></Card>
      <Table><thead className="bg-muted"><tr>{["Centre", "City", "State", "Capacity", "Systems", "Allocated", "GPS"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-t border-border" key={row.name}><td className="p-3 font-semibold">{row.name}</td><td className="p-3">{row.city}</td><td className="p-3">{row.state}</td><td className="p-3">{row.capacity}</td><td className="p-3">{row.systems}</td><td className="p-3">{row.allocated}</td><td className="p-3"><button onClick={() => setNotice(`${row.name} GPS marker opened.`)}><MapPin size={17} /></button></td></tr>)}</tbody></Table>
    </section>
  );
}

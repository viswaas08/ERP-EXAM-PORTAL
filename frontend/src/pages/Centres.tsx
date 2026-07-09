import { MapPin, Shuffle } from "lucide-react";
import { Button, Card, Input, Table } from "../components/ui";

const centres = ["Delhi North CBT Lab", "Pune Digital Campus", "Bengaluru South Centre", "Chennai Knowledge Park", "Jaipur Public School"];

export function Centres() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Examination Centre Management</h1><p className="text-sm text-slate-500">Manage centre capacity, labs, city, state, and candidate allocation.</p></div><Button><Shuffle size={18} /> Auto Allocate</Button></div>
      <Card className="grid gap-3 md:grid-cols-4"><Input placeholder="Centre name" /><Input placeholder="City" /><Input placeholder="State" /><Button className="bg-secondary">Create Centre</Button></Card>
      <Table><thead className="bg-muted"><tr>{["Centre", "City", "State", "Capacity", "Systems", "Allocated", "GPS"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{centres.map((name, i) => <tr className="border-t border-border" key={name}><td className="p-3 font-semibold">{name}</td><td className="p-3">{["Delhi", "Pune", "Bengaluru", "Chennai", "Jaipur"][i]}</td><td className="p-3">{["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Rajasthan"][i]}</td><td className="p-3">{250 + i * 70}</td><td className="p-3">{220 + i * 65}</td><td className="p-3">{160 + i * 38}</td><td className="p-3"><MapPin size={17} /></td></tr>)}</tbody></Table>
    </section>
  );
}

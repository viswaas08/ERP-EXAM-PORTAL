import { MapPin, Shuffle } from "lucide-react";
import { Button, Card, Input, Select, Table } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { tamilNaduDistrictCentres } from "../data/tamilNaduDistricts";

type CentreRow = {
  name: string;
  city: string;
  district: string;
  state: string;
  capacity: number;
  systems: number;
  allocated: number;
};

type RawCentreRow = Partial<CentreRow> & Record<string, unknown>;

const defaultCentres: CentreRow[] = tamilNaduDistrictCentres.map((item, index) => ({
  name: `${item.district} Government Examination Centre`,
  city: item.city,
  district: item.district,
  state: "Tamil Nadu",
  capacity: 300,
  systems: 280,
  allocated: 40 + (index % 6) * 18
}));

function tamilNaduDistrictFor(city: unknown, district: unknown) {
  const districtText = typeof district === "string" ? district : "";
  const cityText = typeof city === "string" ? city : "";
  return tamilNaduDistrictCentres.find((item) => item.district === districtText)
    ?? tamilNaduDistrictCentres.find((item) => item.city === cityText)
    ?? tamilNaduDistrictCentres[0];
}

function normalizeCentreRow(row: RawCentreRow, index: number): CentreRow {
  const location = tamilNaduDistrictFor(row.city, row.district);
  return {
    name: typeof row.name === "string" && row.name.trim() ? row.name : `${location.district} Government Examination Centre`,
    city: location.city,
    district: location.district,
    state: "Tamil Nadu",
    capacity: Number.isFinite(Number(row.capacity)) ? Number(row.capacity) : 300,
    systems: Number.isFinite(Number(row.systems)) ? Number(row.systems) : 280,
    allocated: Number.isFinite(Number(row.allocated)) ? Number(row.allocated) : 40 + (index % 6) * 18
  };
}

function normalizeCentreRows(value: unknown): CentreRow[] {
  if (!Array.isArray(value) || value.length === 0) return defaultCentres;
  return value.map((row, index) => normalizeCentreRow((row ?? {}) as RawCentreRow, index));
}

export function Centres() {
  const [rows, setRows] = usePersistentState<CentreRow[]>("examPortal.centres.rows.v2", defaultCentres);
  const [name, setName] = usePersistentState("examPortal.centres.name", "");
  const [district, setDistrict] = usePersistentState("examPortal.centres.district", "Chennai");
  const [notice, setNotice] = usePersistentState("examPortal.centres.notice.v2", `${defaultCentres.length} Tamil Nadu district centres are ready.`);
  const safeRows = normalizeCentreRows(rows);

  function createCentre() {
    const selected = tamilNaduDistrictCentres.find((item) => item.district === district) ?? tamilNaduDistrictCentres[0];
    const next: CentreRow = {
      name: name || `${selected.district} Additional CBT Centre ${safeRows.length + 1}`,
      city: selected.city,
      district: selected.district,
      state: "Tamil Nadu",
      capacity: 300,
      systems: 280,
      allocated: 0
    };
    setRows((current) => [next, ...normalizeCentreRows(current)]);
    setName("");
    setDistrict("Chennai");
    setNotice(`${next.name} created for ${next.district} district.`);
  }

  function autoAllocate() {
    setRows((current) => normalizeCentreRows(current).map((row) => ({ ...row, allocated: Math.min(row.capacity, row.allocated + 25) })));
    setNotice("Auto allocation completed. Each centre received up to 25 additional candidates.");
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Examination Centre Management</h1><p className="text-sm text-slate-500">Manage Tamil Nadu district centres, capacity, labs, and candidate allocation.</p></div><Button onClick={autoAllocate}><Shuffle size={18} /> Auto Allocate</Button></div>
      <Card className="grid gap-3 md:grid-cols-3"><Input placeholder="Centre name" value={name} onChange={(event) => setName(event.target.value)} /><Select value={district} onChange={(event) => setDistrict(event.target.value)}>{tamilNaduDistrictCentres.map((item) => <option key={item.district} value={item.district}>{item.district} - {item.city}</option>)}</Select><Button className="bg-secondary" onClick={createCentre}>Create Centre</Button></Card>
      <Table><thead className="bg-muted"><tr>{["Centre", "District", "City", "State", "Capacity", "Systems", "Allocated", "GPS"].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{safeRows.map((row) => <tr className="border-t border-border" key={`${row.name}-${row.district}`}><td className="p-3 font-semibold">{row.name}</td><td className="p-3">{row.district}</td><td className="p-3">{row.city}</td><td className="p-3">{row.state}</td><td className="p-3">{row.capacity}</td><td className="p-3">{row.systems}</td><td className="p-3">{row.allocated}</td><td className="p-3"><button onClick={() => setNotice(`${row.name} GPS marker opened.`)}><MapPin size={17} /></button></td></tr>)}</tbody></Table>
    </section>
  );
}

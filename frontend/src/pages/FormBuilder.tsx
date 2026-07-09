import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Input, Select } from "../components/ui";
import { formSections } from "../data/demo";

const types = ["Text", "Email", "Number", "Date", "Dropdown", "Radio", "Checkbox", "File Upload", "Image Upload", "Percentage", "CGPA", "Phone", "Address"];

export function FormBuilder() {
  const [sections, setSections] = useState(formSections);
  const [fieldLabel, setFieldLabel] = useState("Percentage");
  const [notice, setNotice] = useState("Click any field to load it into the properties panel.");

  function addSection() {
    const next = { title: `Custom Section ${sections.length + 1}`, fields: ["New Field"] };
    setSections((current) => [...current, next]);
    setNotice(`${next.title} added.`);
  }

  function saveField() {
    setSections((current) => current.map((section, index) => index === 0 && !section.fields.includes(fieldLabel) ? { ...section, fields: [...section.fields, fieldLabel] } : section));
    setNotice(`${fieldLabel} saved to Personal Details with validation rules.`);
  }

  return (
    <section className="space-y-5">
      <Card className="border-l-4 border-l-primary py-3 text-sm font-medium">{notice}</Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Dynamic Registration Form Builder</h1><p className="text-sm text-slate-500">Configure sections, fields, validation, visibility, and eligibility mapping.</p></div>
        <Button onClick={addSection}><Plus size={18} /> Add Section</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title}>
              <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{section.title}</h2><Badge>Visible</Badge></div>
              <div className="space-y-2">
                {section.fields.map((field) => <button className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left hover:bg-muted" key={field} onClick={() => { setFieldLabel(field); setNotice(`${field} loaded for editing.`); }}><GripVertical size={18} className="text-slate-400" /><span className="flex-1">{field}</span><Badge>Required</Badge><Badge>Editable</Badge></button>)}
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="mb-4 font-semibold">Field Properties</h2>
          <div className="space-y-3">
            <Input placeholder="Field label" value={fieldLabel} onChange={(event) => setFieldLabel(event.target.value)} />
            <Select>{types.map((type) => <option key={type}>{type}</option>)}</Select>
            <Input placeholder="Placeholder" defaultValue="Enter aggregate percentage" />
            <Input placeholder="Help text" defaultValue="Minimum 60% for automatic approval" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["Required", "Visible", "Editable", "Searchable", "Eligibility Field", "Unique"].map((label) => <label className="flex items-center gap-2 rounded-md border border-border p-2" key={label}><input type="checkbox" defaultChecked={label !== "Unique"} />{label}</label>)}
            </div>
            <Button className="w-full" onClick={saveField}>Save Field</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

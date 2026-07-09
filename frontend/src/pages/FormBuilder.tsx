import { GripVertical, Plus } from "lucide-react";
import { Badge, Button, Card, Input, Select } from "../components/ui";
import { formSections } from "../data/demo";
import { usePersistentState } from "../lib/usePersistentState";

export type FormField = {
  label: string;
  type: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  visible?: boolean;
  editable?: boolean;
  searchable?: boolean;
  eligibility?: boolean;
  unique?: boolean;
};

export type FormSection = {
  title: string;
  fields: FormField[];
};

const types = ["Text", "Textarea", "Email", "Password", "Number", "Date", "Dropdown", "Radio", "Checkbox", "Multi Select", "File Upload", "Image Upload", "Percentage", "CGPA", "Phone", "Address", "State", "District", "Pincode", "Aadhaar Masked", "PAN", "Experience Years", "Declaration"];

export function FormBuilder() {
  const [sections, setSections] = usePersistentState<FormSection[]>("examPortal.formBuilder.sections", formSections);
  const [selectedFieldLabel, setSelectedFieldLabel] = usePersistentState("examPortal.formBuilder.selectedFieldLabel", "Full Name");
  const [notice, setNotice] = usePersistentState("examPortal.formBuilder.notice", "Click any field to load it into the properties panel.");

  const selectedField = sections
    .flatMap((s) => s.fields)
    .find((f) => f.label === selectedFieldLabel);

  function updateSelectedField(updated: Partial<FormField>) {
    if (!selectedFieldLabel) return;
    setSections((current) =>
      current.map((section) => ({
        ...section,
        fields: section.fields.map((field) =>
          field.label === selectedFieldLabel ? { ...field, ...updated } : field
        )
      }))
    );
  }

  function addSection() {
    const next = {
      title: `Custom Section ${sections.length + 1}`,
      fields: [
        {
          label: `New Field ${sections.length + 1}`,
          type: "Text",
          placeholder: "",
          helpText: "",
          required: false,
          visible: true,
          editable: true,
          searchable: false,
          eligibility: false,
          unique: false
        }
      ]
    };
    setSections((current) => [...current, next]);
    setSelectedFieldLabel(next.fields[0].label);
    setNotice(`${next.title} added.`);
  }

  function saveField() {
    if (selectedField) {
      setNotice(`${selectedField.label} properties saved to persistent storage.`);
    }
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
                {section.fields.map((field) => (
                  <button
                    className={`flex w-full items-center gap-3 rounded-md border border-border p-3 text-left hover:bg-muted ${selectedFieldLabel === field.label ? "bg-muted/80 border-primary" : ""}`}
                    key={field.label}
                    onClick={() => { setSelectedFieldLabel(field.label); setNotice(`${field.label} loaded for editing.`); }}
                  >
                    <GripVertical size={18} className="text-slate-400" />
                    <span className="flex-1 font-medium">{field.label}</span>
                    <span className="text-xs text-slate-400 mr-2">{field.type}</span>
                    {field.required && <Badge className="bg-orange-50 text-orange-700">Required</Badge>}
                    {field.editable && <Badge className="bg-blue-50 text-blue-700">Editable</Badge>}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="mb-4 font-semibold">Field Properties</h2>
          {selectedField ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Field Label</label>
                <Input
                  placeholder="Field label"
                  value={selectedField.label}
                  onChange={(event) => {
                    const newLabel = event.target.value;
                    updateSelectedField({ label: newLabel });
                    setSelectedFieldLabel(newLabel);
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Field Type</label>
                <Select
                  value={selectedField.type}
                  onChange={(event) => updateSelectedField({ type: event.target.value })}
                >
                  {types.map((type) => <option key={type} value={type}>{type}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Placeholder</label>
                <Input
                  placeholder="Placeholder"
                  value={selectedField.placeholder ?? ""}
                  onChange={(event) => updateSelectedField({ placeholder: event.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Help Text</label>
                <Input
                  placeholder="Help text"
                  value={selectedField.helpText ?? ""}
                  onChange={(event) => updateSelectedField({ helpText: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                {[
                  { name: "Required", key: "required" },
                  { name: "Visible", key: "visible" },
                  { name: "Editable", key: "editable" },
                  { name: "Searchable", key: "searchable" },
                  { name: "Eligibility Field", key: "eligibility" },
                  { name: "Unique", key: "unique" }
                ].map((item) => {
                  const isChecked = Boolean(selectedField[item.key as keyof FormField]);
                  return (
                    <label className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted" key={item.name}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => updateSelectedField({ [item.key]: event.target.checked })}
                      />
                      {item.name}
                    </label>
                  );
                })}
              </div>
              <Button className="w-full" onClick={saveField}>Save Field</Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">Select a field from the left panel to configure its properties.</p>
          )}
        </Card>
      </div>
    </section>
  );
}

import { Play, Plus, Save, Trash2, CheckCircle2, AlertTriangle, Layers, Sliders, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Select } from "../components/ui";
import { usePersistentState } from "../lib/usePersistentState";
import { api } from "../lib/api";

type ExamOption = {
  id: string;
  code: string;
  name: string;
};

type Condition = {
  field: string;
  operator: string;
  value: string;
  connector: string;
};

type Rule = {
  name: string;
  priority: number;
  action: string; // "APPROVE" | "REJECT" | "RETURN"
  conditions: Condition[];
};

type SimulationResult = {
  total: number;
  autoApproved: number;
  manualVerification: number;
  returned: number;
  rejected: number;
};

const fields = ["Qualification", "Percentage", "Nationality", "Category", "State", "District", "Phone"];
const operators = ["equals", "not equals", "greater than", "greater than or equal", "less than", "less than or equal", "contains", "is empty", "is not empty"];
const defaultValues = ["Bachelor's Degree", "12th", "10th", "50", "60", "70", "Indian", "General", "OBC", "SC", "ST", "Tamil Nadu", "Chennai"];
const actions = [
  { value: "APPROVE", label: "Approve Application" },
  { value: "REJECT", label: "Reject Application" },
  { value: "RETURN", label: "Return For Correction" }
];

export function EligibilityRules() {
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = usePersistentState<string | undefined>("examPortal.examinations.selectedExamId", undefined);
  const [rules, setRules] = useState<Rule[]>([]);
  const [notice, setNotice] = useState("Select a target examination to configure rules.");
  const [preview, setPreview] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadExams() {
    try {
      const data = await api<ExamOption[]>("/examinations");
      setExams(data);
      if (data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch {
      setNotice("Could not load examinations list.");
    }
  }

  async function loadRules(examId = selectedExamId) {
    if (!examId) return;
    try {
      const data = await api<any[]>(`/eligibility-rules?examId=${encodeURIComponent(examId)}`);
      if (data && data.length > 0) {
        setRules(
          data.map((r) => ({
            name: r.name,
            priority: r.priority,
            action: r.action,
            conditions: (r.conditions || []).map((c: any) => ({
              field: c.field,
              operator: c.operator,
              value: c.value,
              connector: c.connector || "AND"
            }))
          }))
        );
      } else {
        // Set default template
        setRules([
          {
            name: "Standard Auto-Approval Rule",
            priority: 1,
            action: "APPROVE",
            conditions: [
              { field: "Qualification", operator: "equals", value: "Bachelor's Degree", connector: "AND" },
              { field: "Percentage", operator: "greater than or equal", value: "50", connector: "AND" }
            ]
          }
        ]);
      }
      setNotice("Eligibility rules loaded.");
      setPreview(null);
    } catch {
      setNotice("Could not load rules for selected exam.");
    }
  }

  useEffect(() => {
    void loadExams();
  }, []);

  useEffect(() => {
    void loadRules();
  }, [selectedExamId]);

  function addRule() {
    setRules((current) => [
      ...current,
      {
        name: `Eligibility Rule #${current.length + 1}`,
        priority: current.length + 1,
        action: "APPROVE",
        conditions: [{ field: "Qualification", operator: "equals", value: "Bachelor's Degree", connector: "AND" }]
      }
    ]);
    setNotice("New rule block appended.");
  }

  function deleteRule(ruleIndex: number) {
    setRules((current) => current.filter((_, idx) => idx !== ruleIndex).map((rule, idx) => ({ ...rule, priority: idx + 1 })));
    setNotice("Rule block removed.");
  }

  function addCondition(ruleIndex: number) {
    setRules((current) =>
      current.map((rule, idx) =>
        idx === ruleIndex
          ? {
              ...rule,
              conditions: [...rule.conditions, { field: "Percentage", operator: "greater than or equal", value: "50", connector: "AND" }]
            }
          : rule
      )
    );
  }

  function deleteCondition(ruleIndex: number, condIndex: number) {
    setRules((current) =>
      current.map((rule, idx) =>
        idx === ruleIndex
          ? {
              ...rule,
              conditions: rule.conditions.filter((_, cIdx) => cIdx !== condIndex)
            }
          : rule
      )
    );
  }

  function updateRuleMeta(ruleIndex: number, fieldName: keyof Rule, val: any) {
    setRules((current) => current.map((rule, idx) => (idx === ruleIndex ? { ...rule, [fieldName]: val } : rule)));
  }

  function updateCondition(ruleIndex: number, condIndex: number, fieldName: keyof Condition, val: string) {
    setRules((current) =>
      current.map((rule, rIdx) =>
        rIdx === ruleIndex
          ? {
              ...rule,
              conditions: rule.conditions.map((cond, cIdx) => (cIdx === condIndex ? { ...cond, [fieldName]: val } : cond))
            }
          : rule
      )
    );
  }

  async function saveConfiguration() {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      await api("/eligibility-rules/save", {
        method: "POST",
        body: JSON.stringify({ examId: selectedExamId, rules })
      });
      setNotice("Configuration saved successfully to the database.");
      await loadRules();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save configuration.");
    } finally {
      setLoading(false);
    }
  }

  async function simulate() {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const result = await api<SimulationResult>(`/eligibility-rules/${selectedExamId}/simulate`, { method: "POST" });
      setPreview(result);
      setNotice(`Simulation completed against ${result.total} candidate application(s).`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to run simulation.");
    } finally {
      setLoading(false);
    }
  }

  async function executeBulkDecisions() {
    if (!selectedExamId) return;
    if (!window.confirm("Are you sure you want to execute bulk decisions? This will modify candidate application statuses in the database.")) {
      return;
    }
    setLoading(true);
    try {
      const result = await api<{ updated: number }>(`/eligibility-rules/${selectedExamId}/execute`, { method: "POST" });
      setNotice(`Bulk processing completed! ${result.updated} candidate application(s) were updated in the database.`);
      setPreview(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to execute bulk decisions.");
    } finally {
      setLoading(false);
    }
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <section className="space-y-6">
      {/* Notice Banner */}
      <Card className="border-l-4 border-l-primary py-3 text-sm font-semibold bg-primary/5 text-primary flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        {notice}
      </Card>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eligibility Rule Engine</h1>
          <p className="text-slate-500 mt-1">Configure criteria-based automatic matching to approve, reject, or return applications in bulk.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select className="min-w-64" value={selectedExamId || ""} onChange={(e) => setSelectedExamId(e.target.value || undefined)}>
            <option value="">Choose target exam...</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.code} - {exam.name}
              </option>
            ))}
          </Select>
          <Button className="bg-slate-700" onClick={addRule}>
            <Plus size={16} /> New Rule
          </Button>
        </div>
      </div>

      {selectedExamId ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rules Builder Column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders size={18} className="text-primary" /> Active Rule Specifications
            </h2>

            {rules.map((rule, ruleIdx) => (
              <Card key={ruleIdx} className="border border-border relative overflow-hidden">
                {/* Header panel */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Badge className="font-mono bg-indigo-50 text-indigo-700 font-bold border-indigo-100">
                      Priority {rule.priority}
                    </Badge>
                    <input
                      type="text"
                      className="font-bold text-slate-800 text-sm outline-none border-b border-transparent hover:border-slate-200 focus:border-primary bg-transparent px-1"
                      value={rule.name}
                      onChange={(e) => updateRuleMeta(ruleIdx, "name", e.target.value)}
                    />
                  </div>
                  <Button className="h-8 w-8 text-rose-600 hover:bg-rose-50 border-transparent p-0 bg-transparent" onClick={() => deleteRule(ruleIdx)}>
                    <Trash2 size={15} />
                  </Button>
                </div>

                {/* Conditions list */}
                <div className="space-y-3.5">
                  {rule.conditions.map((cond, condIdx) => (
                    <div className="grid gap-2 sm:grid-cols-4 items-center bg-slate-50/50 p-2 rounded-md border border-slate-100" key={condIdx}>
                      <Select value={cond.field} onChange={(e) => updateCondition(ruleIdx, condIdx, "field", e.target.value)}>
                        {fields.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </Select>

                      <Select value={cond.operator} onChange={(e) => updateCondition(ruleIdx, condIdx, "operator", e.target.value)}>
                        {operators.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </Select>

                      <div className="relative">
                        <Input
                          placeholder="Condition value..."
                          value={cond.value}
                          onChange={(e) => updateCondition(ruleIdx, condIdx, "value", e.target.value)}
                          list={`vals-${ruleIdx}-${condIdx}`}
                        />
                        <datalist id={`vals-${ruleIdx}-${condIdx}`}>
                          {defaultValues.map((v) => (
                            <option key={v} value={v} />
                          ))}
                        </datalist>
                      </div>

                      <div className="flex gap-2 items-center">
                        <Select
                          className="flex-1"
                          value={cond.connector}
                          onChange={(e) => updateCondition(ruleIdx, condIdx, "connector", e.target.value)}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </Select>
                        {rule.conditions.length > 1 && (
                          <Button
                            className="h-8 w-8 text-slate-400 bg-transparent hover:text-rose-600 p-0 border-transparent"
                            onClick={() => deleteCondition(ruleIdx, condIdx)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rule conclusion footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100 text-xs">
                  <Button className="bg-transparent text-primary hover:bg-primary/5 border-transparent text-xs p-0 flex items-center gap-1" onClick={() => addCondition(ruleIdx)}>
                    <Plus size={14} /> Add Condition
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">THEN:</span>
                    <Select
                      className="w-48 bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                      value={rule.action}
                      onChange={(e) => updateRuleMeta(ruleIdx, "action", e.target.value)}
                    >
                      {actions.map((act) => (
                        <option key={act.value} value={act.value}>
                          {act.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </Card>
            ))}

            <div className="flex gap-3 justify-end pt-2">
              <Button className="bg-indigo-600 hover:opacity-90 flex items-center gap-1.5 font-bold" disabled={loading} onClick={saveConfiguration}>
                <Save size={16} /> Save Configuration
              </Button>
            </div>
          </div>

          {/* Simulation & Bulk Action Panel Column */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Play size={18} className="text-indigo-600" /> Run Decisions Engine
            </h2>

            {/* Simulated target box */}
            <Card className="border border-border space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-md">
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Configured Target Exam</span>
                <span className="font-bold text-slate-800 text-sm">{selectedExam ? `${selectedExam.code} - ${selectedExam.name}` : "Exam Error"}</span>
              </div>

              <div className="space-y-2">
                <Button className="w-full bg-secondary h-10 font-bold flex items-center justify-center gap-1.5" disabled={loading} onClick={simulate}>
                  <Play size={15} /> Simulate Rules Engine
                </Button>
                <Button className="w-full bg-emerald-600 hover:opacity-90 h-10 font-bold flex items-center justify-center gap-1.5" disabled={loading} onClick={executeBulkDecisions}>
                  <CheckCircle2 size={15} /> Execute Bulk Decisions
                </Button>
              </div>
            </Card>

            {/* Simulation Preview Results */}
            {preview && (
              <Card className="border border-border space-y-3.5">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-100">
                  <span>Simulation Results</span>
                  <Badge className="bg-slate-100 text-slate-700 font-mono text-[9px]">{preview.total} applications</Badge>
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-2.5 rounded-md font-semibold text-emerald-800">
                    <span>Auto Approved</span>
                    <span>{preview.autoApproved}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-md font-semibold text-slate-700">
                    <span>Manual Verification</span>
                    <span>{preview.manualVerification}</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50 border border-amber-100 p-2.5 rounded-md font-semibold text-amber-800">
                    <span>Returned For Correction</span>
                    <span>{preview.returned}</span>
                  </div>
                  <div className="flex justify-between items-center bg-rose-50 border border-rose-100 p-2.5 rounded-md font-semibold text-rose-800">
                    <span>Rejected</span>
                    <span>{preview.rejected}</span>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-md text-[10px] text-amber-800 flex items-start gap-1.5 leading-relaxed font-medium">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Simulated results represent matches based on current data. Click "Execute Bulk Decisions" above to apply status values to database records.
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="text-center py-16 border-2 border-dashed rounded-lg text-slate-400">
          Please select an examination from the dropdown list to configure eligibility rules.
        </Card>
      )}
    </section>
  );
}

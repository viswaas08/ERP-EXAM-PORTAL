import { Copy, Pencil, PlayCircle, Plus, Radio, Trash2, Eye, Archive, RefreshCw, BookOpen, Users, CheckCircle, Award, Settings, BarChart2, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Select, Table } from "../components/ui";
import { api } from "../lib/api";
import { usePersistentState } from "../lib/usePersistentState";

type WorkflowPhase = {
  id: string;
  name: string;
  status: string;
  opensAt: string;
  closesAt: string;
};

type ExamRow = {
  id: string;
  code: string;
  name: string;
  examName: string;
  examCode: string;
  department: string;
  course: string;
  semester?: string;
  subject: string;
  examType: string;
  examDate: string;
  startTime: string;
  duration: number;
  instructions?: string;
  questionBank?: string;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  allowResume: boolean;
  maximumAttempts: number;
  status: string;
  workflowPhases?: WorkflowPhase[];
  applications: number;
  dates: string;
  phase: string;
};

type ApiExam = {
  id: string;
  code: string;
  name: string;
  examName?: string;
  examCode?: string;
  department: string;
  course?: string;
  semester?: string;
  subject?: string;
  examType?: string;
  examDate?: string;
  startTime?: string;
  duration?: number;
  instructions?: string;
  questionBank?: string;
  totalQuestions?: number;
  totalMarks?: number;
  passingMarks?: number;
  negativeMarkingEnabled?: boolean;
  negativeMarks?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  allowResume?: boolean;
  maximumAttempts?: number;
  status: string;
  workflowPhases: WorkflowPhase[];
  _count?: { applications: number };
};

type QuestionBankOption = {
  id: string;
  name: string;
  exam: { code: string };
  _count?: { questions: number };
};

type CandidateAttempt = {
  id: string;
  attemptNumber: number;
  studentId: string;
  score: number;
  percentage: number;
  rank: number;
  resultStatus: string;
  evaluationStatus: string;
  submittedAt: string;
  candidateName: string;
  candidateEmail: string;
};

const departments = [
  "University Authority",
  "Administrative Services",
  "Higher Education",
  "Public Works",
  "Health Services",
  "Police Recruitment",
  "Technical Education"
];

const examTypes = [
  "Mock Test",
  "Entrance Exam",
  "Internal Assessment",
  "Semester Examination"
];

const statusOptions = ["DRAFT", "PUBLISHED", "ONLINE", "COMPLETED", "RESULTS_PUBLISHED", "ARCHIVED"];

function mapApiExam(exam: ApiExam): ExamRow {
  const activePhase = exam.workflowPhases.find((phase) => phase.status === "OPEN") ?? exam.workflowPhases[0];
  const examNameVal = exam.examName || exam.name;
  const examCodeVal = exam.examCode || exam.code;

  return {
    id: exam.id,
    code: examCodeVal,
    name: examNameVal,
    examName: examNameVal,
    examCode: examCodeVal,
    department: exam.department,
    course: exam.course || "N/A",
    semester: exam.semester || "",
    subject: exam.subject || "N/A",
    examType: exam.examType || "Mock Test",
    examDate: exam.examDate ? new Date(exam.examDate).toISOString().split("T")[0] : "",
    startTime: exam.startTime || "10:00",
    duration: exam.duration || 120,
    instructions: exam.instructions || "",
    questionBank: exam.questionBank || "",
    totalQuestions: exam.totalQuestions || 0,
    totalMarks: exam.totalMarks || 0,
    passingMarks: exam.passingMarks || 0,
    negativeMarkingEnabled: exam.negativeMarkingEnabled || false,
    negativeMarks: exam.negativeMarks || 0,
    randomizeQuestions: exam.randomizeQuestions || false,
    randomizeOptions: exam.randomizeOptions || false,
    allowResume: exam.allowResume || false,
    maximumAttempts: exam.maximumAttempts || 1,
    status: exam.status,
    workflowPhases: exam.workflowPhases,
    dates: activePhase ? `${new Date(activePhase.opensAt).toLocaleDateString()} - ${new Date(activePhase.closesAt).toLocaleDateString()}` : "Not scheduled",
    applications: exam._count?.applications ?? 0,
    phase: activePhase?.name ?? "Registration"
  };
}

export function Examinations() {
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState("Loading examinations...");
  const [selectedExamId, setSelectedExamId] = usePersistentState<string | undefined>("examPortal.examinations.selectedExamId", undefined);
  const [activeTab, setActiveTab] = useState("overview");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamRow | null>(null);
  const [questionBanks, setQuestionBanks] = useState<QuestionBankOption[]>([]);
  const [attempts, setAttempts] = useState<CandidateAttempt[]>([]);

  // Form fields
  const [formExamName, setFormExamName] = useState("");
  const [formExamCode, setFormExamCode] = useState("");
  const [formDepartment, setFormDepartment] = useState("University Authority");
  const [formCourse, setFormCourse] = useState("");
  const [formSemester, setFormSemester] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formExamType, setFormExamType] = useState("Mock Test");
  const [formExamDate, setFormExamDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("10:00");
  const [formDuration, setFormDuration] = useState(120);
  const [formTotalQuestions, setFormTotalQuestions] = useState(50);
  const [formTotalMarks, setFormTotalMarks] = useState(100);
  const [formPassingMarks, setFormPassingMarks] = useState(40);
  const [formNegativeMarking, setFormNegativeMarking] = useState(false);
  const [formNegativeMarks, setFormNegativeMarks] = useState(0.25);
  const [formInstructions, setFormInstructions] = useState("");
  const [formQuestionBank, setFormQuestionBank] = useState("");
  const [formRandomizeQuestions, setFormRandomizeQuestions] = useState(false);
  const [formRandomizeOptions, setFormRandomizeOptions] = useState(false);
  const [formAllowResume, setFormAllowResume] = useState(true);
  const [formMaxAttempts, setFormMaxAttempts] = useState(1);

  const selectedExam = useMemo(() => rows.find(r => r.id === selectedExamId), [rows, selectedExamId]);

  function loadExams() {
    api<ApiExam[]>("/examinations")
      .then((data) => {
        const mapped = data.map(mapApiExam);
        setRows(mapped);
        if (mapped.length && !selectedExamId) {
          setSelectedExamId(mapped[0].id);
        }
        setNotice(mapped.length ? "Loaded examinations successfully." : "No examinations found.");
      })
      .catch((err) => {
        setNotice("Failed to load examinations from API.");
      });
  }

  function loadQuestionBanks() {
    api<QuestionBankOption[]>("/questions/banks")
      .then((banks) => setQuestionBanks(banks))
      .catch(() => undefined);
  }

  function loadAttempts(examId: string) {
    api<CandidateAttempt[]>(`/results/attempts?examId=${examId}`)
      .then((data) => setAttempts(data))
      .catch(() => setAttempts([]));
  }

  useEffect(() => {
    loadExams();
    loadQuestionBanks();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadAttempts(selectedExamId);
    }
  }, [selectedExamId]);

  const filteredRows = useMemo(() => {
    return rows.filter((exam) => {
      const textMatch = `${exam.code} ${exam.name} ${exam.subject}`.toLowerCase().includes(search.toLowerCase());
      const departmentMatch = !departmentFilter || exam.department === departmentFilter;
      const statusMatch = !statusFilter || exam.status === statusFilter;
      return textMatch && departmentMatch && statusMatch;
    });
  }, [rows, search, departmentFilter, statusFilter]);

  function openCreateForm() {
    setEditingExam(null);
    setFormExamName("");
    setFormExamCode(`EXAM-${Date.now().toString().slice(-6)}`);
    setFormDepartment("University Authority");
    setFormCourse("");
    setFormSemester("");
    setFormSubject("");
    setFormExamType("Mock Test");
    setFormExamDate(new Date().toISOString().split("T")[0]);
    setFormStartTime("10:00");
    setFormDuration(120);
    setFormTotalQuestions(50);
    setFormTotalMarks(100);
    setFormPassingMarks(40);
    setFormNegativeMarking(false);
    setFormNegativeMarks(0.25);
    setFormInstructions("");
    setFormQuestionBank(questionBanks[0]?.id || "");
    setFormRandomizeQuestions(false);
    setFormRandomizeOptions(false);
    setFormAllowResume(true);
    setFormMaxAttempts(1);
    setIsFormOpen(true);
  }

  function openEditForm(exam: ExamRow) {
    setEditingExam(exam);
    setFormExamName(exam.examName);
    setFormExamCode(exam.examCode);
    setFormDepartment(exam.department);
    setFormCourse(exam.course);
    setFormSemester(exam.semester || "");
    setFormSubject(exam.subject);
    setFormExamType(exam.examType);
    setFormExamDate(exam.examDate);
    setFormStartTime(exam.startTime);
    setFormDuration(exam.duration);
    setFormTotalQuestions(exam.totalQuestions);
    setFormTotalMarks(exam.totalMarks);
    setFormPassingMarks(exam.passingMarks);
    setFormNegativeMarking(exam.negativeMarkingEnabled);
    setFormNegativeMarks(exam.negativeMarks);
    setFormInstructions(exam.instructions || "");
    setFormQuestionBank(exam.questionBank || "");
    setFormRandomizeQuestions(exam.randomizeQuestions);
    setFormRandomizeOptions(exam.randomizeOptions);
    setFormAllowResume(exam.allowResume);
    setFormMaxAttempts(exam.maximumAttempts);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(statusValue: string) {
    const payload = {
      examName: formExamName,
      examCode: formExamCode,
      department: formDepartment,
      course: formCourse,
      semester: formSemester || null,
      subject: formSubject,
      examType: formExamType,
      examDate: formExamDate,
      startTime: formStartTime,
      duration: Number(formDuration),
      totalQuestions: Number(formTotalQuestions),
      totalMarks: Number(formTotalMarks),
      passingMarks: Number(formPassingMarks),
      negativeMarkingEnabled: formNegativeMarking,
      negativeMarks: Number(formNegativeMarks),
      instructions: formInstructions,
      questionBank: formQuestionBank,
      randomizeQuestions: formRandomizeQuestions,
      randomizeOptions: formRandomizeOptions,
      allowResume: formAllowResume,
      maximumAttempts: Number(formMaxAttempts),
      status: statusValue
    };

    try {
      if (editingExam) {
        const updated = await api<ApiExam>(`/examinations/${editingExam.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        setNotice(`Successfully updated exam: ${updated.code}`);
      } else {
        const created = await api<ApiExam>("/examinations", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setNotice(`Successfully created exam: ${created.code}`);
        setSelectedExamId(created.id);
      }
      setIsFormOpen(false);
      loadExams();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Error saving examination.");
    }
  }

  async function deleteExam(id: string) {
    if (!window.confirm("Are you sure you want to delete this examination?")) return;
    try {
      await api(`/examinations/${id}`, { method: "DELETE" });
      setNotice("Examination deleted successfully.");
      loadExams();
    } catch (err) {
      setNotice("Failed to delete examination.");
    }
  }

  async function duplicateExam(id: string) {
    try {
      const cloned = await api<ApiExam>(`/examinations/${id}/clone`, { method: "POST" });
      setNotice(`Cloned examination as ${cloned.code}`);
      loadExams();
    } catch (err) {
      setNotice("Failed to duplicate examination.");
    }
  }

  async function makeOnline(id: string) {
    try {
      const updated = await api<ApiExam>(`/examinations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ONLINE" })
      });
      setNotice(`Exam ${updated.code} is now ONLINE and available to candidates.`);
      loadExams();
    } catch (err) {
      setNotice("Failed to make exam online.");
    }
  }

  async function archiveExam(id: string) {
    try {
      const updated = await api<ApiExam>(`/examinations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ARCHIVED" })
      });
      setNotice(`Exam ${updated.code} archived successfully.`);
      loadExams();
    } catch (err) {
      setNotice("Failed to archive exam.");
    }
  }

  async function reopenExam(id: string) {
    try {
      const updated = await api<ApiExam>(`/examinations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ONLINE" })
      });
      setNotice(`Exam ${updated.code} reopened and made ONLINE.`);
      loadExams();
    } catch (err) {
      setNotice("Failed to reopen exam.");
    }
  }

  async function publishResults(id: string) {
    try {
      await api(`/results/publish`, {
        method: "POST",
        body: JSON.stringify({ examId: id })
      });
      setNotice("Results published and system phase transitioned to Result Publication.");
      loadExams();
    } catch (err) {
      setNotice("Failed to publish results.");
    }
  }

  async function unpublishResults(id: string) {
    try {
      await api(`/results/unpublish`, {
        method: "POST",
        body: JSON.stringify({ examId: id })
      });
      setNotice("Results unpublished and phase returned to Evaluation.");
      loadExams();
    } catch (err) {
      setNotice("Failed to unpublish results.");
    }
  }

  async function republishResults(id: string) {
    try {
      await api(`/results/republish`, {
        method: "POST",
        body: JSON.stringify({ examId: id })
      });
      setNotice("Results recalculated and republished successfully.");
      loadExams();
    } catch (err) {
      setNotice("Failed to republish results.");
    }
  }

  async function activatePhase(phaseId: string) {
    if (!selectedExamId) return;
    try {
      await api(`/examinations/${selectedExamId}/workflow-phases/${phaseId}/activate`, { method: "PATCH" });
      setNotice("Workflow phase activated successfully.");
      loadExams();
    } catch (err) {
      setNotice("Failed to activate phase.");
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    if (!attempts.length) return { count: 0, avg: 0, passRate: 0 };
    const count = attempts.length;
    const avg = attempts.reduce((acc, a) => acc + a.score, 0) / count;
    const passes = attempts.filter(a => a.resultStatus === "PASS").length;
    const passRate = (passes / count) * 100;
    return { count, avg, passRate };
  }, [attempts]);

  return (
    <section className="space-y-6">
      {/* Notice Banner */}
      <Card className="border-l-4 border-l-primary py-3 text-sm font-semibold bg-primary/5 text-primary flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        {notice}
      </Card>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Examinations</h1>
          <p className="text-slate-500 mt-1">Manage the complete university competitive examination registry and lifecycles.</p>
        </div>
        <Button className="bg-primary shadow-md hover:translate-y-[-1px] transition-transform" onClick={openCreateForm}>
          <Plus size={18} /> Create Exam Form
        </Button>
      </div>

      {/* Filters and List Table */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center gap-4 py-4">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search exam name, code, subject..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="w-[200px]">
              <Select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </Select>
            </div>
            <div className="w-[160px]">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {statusOptions.map((st) => <option key={st} value={st}>{st}</option>)}
              </Select>
            </div>
          </Card>

          <Table>
            <thead className="bg-muted/80 font-bold border-b border-border text-slate-700">
              <tr>
                <th className="p-3.5">Exam Name & Code</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Exam Date</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Questions</th>
                <th className="p-3.5">Attempts</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((exam) => (
                <tr
                  className={`hover:bg-muted/40 cursor-pointer transition-colors ${selectedExamId === exam.id ? "bg-primary/5" : ""}`}
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                >
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{exam.examName}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{exam.examCode}</div>
                  </td>
                  <td className="p-3.5 text-slate-700">{exam.department}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{exam.subject}</td>
                  <td className="p-3.5 text-slate-600 font-mono">{exam.examDate || "Unscheduled"}</td>
                  <td className="p-3.5 text-slate-600 font-mono">{exam.duration} Min</td>
                  <td className="p-3.5 font-semibold text-center">{exam.totalQuestions}</td>
                  <td className="p-3.5 font-semibold text-center">{exam.maximumAttempts}</td>
                  <td className="p-3.5">
                    <Badge className={
                      exam.status === "ONLINE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      exam.status === "PUBLISHED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      exam.status === "RESULTS_PUBLISHED" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      exam.status === "ARCHIVED" ? "bg-slate-100 text-slate-600" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }>
                      {exam.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <Button className="h-8 w-8 px-0 bg-slate-100 text-slate-700 hover:bg-slate-200" title="Edit" onClick={() => openEditForm(exam)}>
                        <Pencil size={14} />
                      </Button>
                      <Button className="h-8 w-8 px-0 bg-slate-100 text-slate-700 hover:bg-slate-200" title="Duplicate" onClick={() => duplicateExam(exam.id)}>
                        <Copy size={14} />
                      </Button>
                      {exam.status === "ARCHIVED" ? (
                        <Button className="h-8 w-8 px-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-200" title="Reopen" onClick={() => reopenExam(exam.id)}>
                          <PlayCircle size={14} />
                        </Button>
                      ) : exam.status !== "ONLINE" ? (
                        <Button className="h-8 w-8 px-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-200" title="Make Online" onClick={() => makeOnline(exam.id)}>
                          <PlayCircle size={14} />
                        </Button>
                      ) : (
                        <Button className="h-8 w-8 px-0 bg-slate-100 text-slate-700 hover:bg-slate-200" title="Archive" onClick={() => archiveExam(exam.id)}>
                          <Archive size={14} />
                        </Button>
                      )}
                      <Button className="h-8 w-8 px-0 bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete" onClick={() => deleteExam(exam.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredRows.length && (
                <tr>
                  <td className="p-8 text-center text-slate-400" colSpan={9}>
                    No examinations match the filters. Click "Create Exam Form" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Selected Exam detail dashboard */}
        <div className="space-y-6">
          {selectedExam ? (
            <Card className="border border-border shadow-md">
              <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">{selectedExam.examCode}</Badge>
                  <Badge className={
                    selectedExam.status === "ONLINE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    selectedExam.status === "PUBLISHED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    selectedExam.status === "RESULTS_PUBLISHED" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    "bg-slate-100 text-slate-600"
                  }>
                    {selectedExam.status}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold mt-2 text-slate-900">{selectedExam.examName}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedExam.department}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border text-xs font-semibold mb-4 overflow-x-auto gap-2">
                {[
                  { id: "overview", label: "Overview", icon: <Eye size={12} /> },
                  { id: "details", label: "Config", icon: <Settings size={12} /> },
                  { id: "attempts", label: "Attempts", icon: <Users size={12} /> },
                  { id: "stats", label: "Stats", icon: <BarChart2 size={12} /> },
                  { id: "phases", label: "Workflow", icon: <List size={12} /> }
                ].map(t => (
                  <button
                    className={`pb-2 px-1 flex items-center gap-1 border-b-2 transition-all ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                      <div className="text-slate-400 font-medium">Exam Date</div>
                      <div className="font-bold text-slate-800 mt-1 font-mono">{selectedExam.examDate || "N/A"}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                      <div className="text-slate-400 font-medium">Start Time</div>
                      <div className="font-bold text-slate-800 mt-1 font-mono">{selectedExam.startTime}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                      <div className="text-slate-400 font-medium">Duration</div>
                      <div className="font-bold text-slate-800 mt-1 font-mono">{selectedExam.duration} Minutes</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                      <div className="text-slate-400 font-medium">Total Questions</div>
                      <div className="font-bold text-slate-800 mt-1">{selectedExam.totalQuestions}</div>
                    </div>
                  </div>

                  {selectedExam.instructions && (
                    <div className="text-xs border border-border bg-slate-50/50 p-3 rounded-md">
                      <div className="font-bold text-slate-700 mb-1">Instructions</div>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedExam.instructions}</p>
                    </div>
                  )}

                  {/* Actions Area */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="font-bold text-xs text-slate-700 mb-2">Examination Controls:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedExam.status !== "ONLINE" && (
                        <Button className="bg-emerald-600 flex-1 text-xs py-1 h-9" onClick={() => makeOnline(selectedExam.id)}>
                          <PlayCircle size={14} /> Make Online
                        </Button>
                      )}
                      {selectedExam.status === "ONLINE" && (
                        <Button className="bg-slate-700 flex-1 text-xs py-1 h-9" onClick={() => archiveExam(selectedExam.id)}>
                          <Archive size={14} /> Archive Exam
                        </Button>
                      )}
                      {selectedExam.status === "ARCHIVED" && (
                        <Button className="bg-emerald-600 flex-1 text-xs py-1 h-9" onClick={() => reopenExam(selectedExam.id)}>
                          <RefreshCw size={14} /> Reopen Exam
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-primary flex-1 text-xs py-1 h-9" onClick={() => publishResults(selectedExam.id)}>
                        Publish Results
                      </Button>
                      <Button className="bg-indigo-600 flex-1 text-xs py-1 h-9" onClick={() => republishResults(selectedExam.id)}>
                        Republish
                      </Button>
                      <Button className="bg-slate-500 flex-1 text-xs py-1 h-9" onClick={() => unpublishResults(selectedExam.id)}>
                        Unpublish
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Course / Class</span>
                    <span className="font-semibold text-slate-800">{selectedExam.course}</span>
                  </div>
                  {selectedExam.semester && (
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Semester</span>
                      <span className="font-semibold text-slate-800">{selectedExam.semester}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Subject</span>
                    <span className="font-semibold text-slate-800">{selectedExam.subject}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Exam Type</span>
                    <span className="font-semibold text-slate-800">{selectedExam.examType}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Total Marks</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedExam.totalMarks} Marks</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Passing Marks</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedExam.passingMarks} Marks</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Negative Marking</span>
                    <span className="font-semibold text-slate-800">
                      {selectedExam.negativeMarkingEnabled ? `Enabled (-${selectedExam.negativeMarks})` : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Max Attempts Allowed</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedExam.maximumAttempts} Attempt(s)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Randomize Questions</span>
                    <span className="font-semibold text-slate-800">{selectedExam.randomizeQuestions ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Randomize Options</span>
                    <span className="font-semibold text-slate-800">{selectedExam.randomizeOptions ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Allow Resume Mid-exam</span>
                    <span className="font-semibold text-slate-800">{selectedExam.allowResume ? "Yes" : "No"}</span>
                  </div>
                </div>
              )}

              {activeTab === "attempts" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-slate-700">Audit Attempt Logs ({attempts.length})</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {attempts.map((att) => (
                      <div className="border border-border p-2.5 rounded-md bg-slate-50/50 hover:bg-slate-50 text-xs flex flex-col gap-1.5" key={att.id}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{att.candidateName}</span>
                          <Badge className="font-mono text-[9px] bg-slate-100 px-1 py-0">Attempt #{att.attemptNumber}</Badge>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{att.candidateEmail}</div>
                        <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-1.5">
                          <span className="font-mono text-slate-700">Score: <strong className="text-slate-900">{att.score}</strong></span>
                          <span className="font-mono text-slate-700">Pct: <strong className="text-slate-900">{att.percentage.toFixed(1)}%</strong></span>
                          <Badge className={att.resultStatus === "PASS" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-destructive/10 text-destructive"}>
                            {att.resultStatus}
                          </Badge>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono text-right">{new Date(att.submittedAt).toLocaleString()}</div>
                      </div>
                    ))}
                    {!attempts.length && (
                      <div className="text-center text-slate-400 py-6 text-xs">
                        No candidate attempts submitted yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="p-3 text-center border border-slate-100 bg-slate-50">
                      <div className="text-slate-400 font-medium text-[10px]">Total Attempts</div>
                      <div className="text-lg font-bold text-slate-900 mt-1 font-mono">{stats.count}</div>
                    </Card>
                    <Card className="p-3 text-center border border-slate-100 bg-slate-50">
                      <div className="text-slate-400 font-medium text-[10px]">Average Score</div>
                      <div className="text-lg font-bold text-slate-900 mt-1 font-mono">{stats.avg.toFixed(1)}</div>
                    </Card>
                    <Card className="p-3 text-center border border-slate-100 bg-slate-50">
                      <div className="text-slate-400 font-medium text-[10px]">Pass Rate</div>
                      <div className="text-lg font-bold text-slate-900 mt-1 font-mono">{stats.passRate.toFixed(0)}%</div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "phases" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-xs text-slate-700">Workflow Phase Engine</h3>
                  <div className="space-y-2">
                    {selectedExam.workflowPhases?.map((phase, index) => (
                      <div
                        className={`p-2.5 rounded-md border flex items-center justify-between text-xs transition-colors ${phase.status === "OPEN" ? "bg-primary/5 border-primary/20 font-semibold" : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"}`}
                        key={phase.id}
                        onClick={() => activatePhase(phase.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono">Step {index + 1}</div>
                          <div className="text-slate-800 mt-0.5">{phase.name}</div>
                        </div>
                        <Badge className={phase.status === "OPEN" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                          {phase.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200">
              Select an examination from the list to display details and controls here.
            </Card>
          )}
        </div>
      </div>

      {/* Exam creation/editing modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card shadow-2xl border border-border p-6 flex flex-col gap-6 scrollbar-thin">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingExam ? "Edit Examination Registry" : "Register New Examination"}
              </h2>
              <button className="text-slate-400 hover:text-slate-600 font-bold text-lg" onClick={() => setIsFormOpen(false)}>×</button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 text-sm">
              {/* Left Side */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Exam Name *</label>
                  <Input placeholder="e.g. Bachelor of Science Entrance Exam" value={formExamName} onChange={(e) => setFormExamName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Exam Code (System Generated) *</label>
                  <Input placeholder="e.g. BSC-ENTRANCE" value={formExamCode} onChange={(e) => setFormExamCode(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department *</label>
                    <Select value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)}>
                      {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Course *</label>
                    <Input placeholder="e.g. B.Sc. Physics" value={formCourse} onChange={(e) => setFormCourse(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Semester (Optional)</label>
                    <Input placeholder="e.g. Semester 1" value={formSemester} onChange={(e) => setFormSemester(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject *</label>
                    <Input placeholder="e.g. Mathematics" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Exam Type *</label>
                  <Select value={formExamType} onChange={(e) => setFormExamType(e.target.value)}>
                    {examTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Exam Date *</label>
                    <Input type="date" value={formExamDate} onChange={(e) => setFormExamDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Time *</label>
                    <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Question Bank Selection *</label>
                  <Select value={formQuestionBank} onChange={(e) => setFormQuestionBank(e.target.value)}>
                    {questionBanks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.exam.code} - {bank.name} ({bank._count?.questions ?? 0} Qs)
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Right Side */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duration (Min) *</label>
                    <Input type="number" value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Questions *</label>
                    <Input type="number" value={formTotalQuestions} onChange={(e) => setFormTotalQuestions(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Max Attempts *</label>
                    <Input type="number" value={formMaxAttempts} onChange={(e) => setFormMaxAttempts(Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Total Marks *</label>
                    <Input type="number" value={formTotalMarks} onChange={(e) => setFormTotalMarks(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Passing Marks *</label>
                    <Input type="number" value={formPassingMarks} onChange={(e) => setFormPassingMarks(Number(e.target.value))} />
                  </div>
                </div>

                {/* Negative Marking Group */}
                <div className="border border-border rounded-md p-3.5 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-600">Negative Marking Enabled</span>
                    <input
                      checked={formNegativeMarking}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      type="checkbox"
                      onChange={(e) => setFormNegativeMarking(e.target.checked)}
                    />
                  </div>
                  {formNegativeMarking && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Deducted Marks Per Wrong Answer</label>
                      <Input type="number" step="0.05" value={formNegativeMarks} onChange={(e) => setFormNegativeMarks(Number(e.target.value))} />
                    </div>
                  )}
                </div>

                {/* Randomize checklist */}
                <div className="grid grid-cols-3 gap-2 py-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <input checked={formRandomizeQuestions} type="checkbox" onChange={(e) => setFormRandomizeQuestions(e.target.checked)} />
                    Random Questions
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <input checked={formRandomizeOptions} type="checkbox" onChange={(e) => setFormRandomizeOptions(e.target.checked)} />
                    Random Options
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <input checked={formAllowResume} type="checkbox" onChange={(e) => setFormAllowResume(e.target.checked)} />
                    Allow Resume
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Instructions</label>
                  <textarea
                    className="w-full rounded-md border border-border p-2.5 text-sm bg-white dark:bg-slate-900 h-24 outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Provide exam rules and details..."
                    value={formInstructions}
                    onChange={(e) => setFormInstructions(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4 mt-2">
              <Button className="bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-slate-600" onClick={() => handleFormSubmit("DRAFT")}>
                Save Draft
              </Button>
              <Button className="bg-blue-600" onClick={() => handleFormSubmit("PUBLISHED")}>
                Publish Exam
              </Button>
              <Button className="bg-emerald-600" onClick={() => handleFormSubmit("ONLINE")}>
                Make Online
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}

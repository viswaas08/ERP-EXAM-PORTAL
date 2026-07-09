import {
  Award,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  FileClock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  ShieldCheck,
  Ticket,
  Users
} from "lucide-react";

export const navItems = [
  { title: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { title: "Examinations", path: "/admin/examinations", icon: CalendarClock },
  { title: "Form Builder", path: "/admin/form-builder", icon: FileText },
  { title: "Eligibility Rules", path: "/admin/rules", icon: ListChecks },
  { title: "Applications", path: "/admin/applications", icon: Users },
  { title: "Verification", path: "/admin/verification", icon: ShieldCheck },
  { title: "Centres", path: "/admin/centres", icon: Building2 },
  { title: "Hall Tickets", path: "/admin/hall-tickets", icon: Ticket },
  { title: "Question Bank", path: "/admin/questions", icon: BookOpenCheck },
  { title: "Results", path: "/admin/results", icon: Award },
  { title: "Audit Logs", path: "/admin/audit", icon: ScrollText },
  { title: "Settings", path: "/admin/settings", icon: Settings }
];

export const stats = [
  { label: "Total Examinations", value: 0, icon: GraduationCap, tone: "text-blue-700" },
  { label: "Total Candidates", value: 0, icon: Users, tone: "text-teal-700" },
  { label: "Applications", value: 0, icon: FileText, tone: "text-amber-700" },
  { label: "Approved", value: 0, icon: BadgeCheck, tone: "text-emerald-700" },
  { label: "Pending", value: 0, icon: FileClock, tone: "text-orange-700" },
  { label: "Rejected", value: 0, icon: FileCheck2, tone: "text-red-700" },
  { label: "Hall Tickets", value: 0, icon: Ticket, tone: "text-indigo-700" },
  { label: "Appeared", value: 0, icon: ClipboardCheck, tone: "text-cyan-700" }
];

export const registrationTrend = [
  { day: "Mon", registrations: 0, approved: 0 },
  { day: "Tue", registrations: 0, approved: 0 },
  { day: "Wed", registrations: 0, approved: 0 },
  { day: "Thu", registrations: 0, approved: 0 },
  { day: "Fri", registrations: 0, approved: 0 },
  { day: "Sat", registrations: 0, approved: 0 },
  { day: "Sun", registrations: 0, approved: 0 }
];

export const statusData = [
  { name: "Approved", value: 0 },
  { name: "Pending", value: 0 },
  { name: "Rejected", value: 0 }
];

export const exams = [
  {
    code: "CREATE-FIRST",
    name: "Create an examination from Admin",
    department: "Not configured",
    phase: "Registration",
    dates: "Schedule pending",
    applications: 0,
    status: "Draft"
  }
];

export const phases = ["Registration", "Correction Window", "Verification", "Hall Ticket Release", "Online Examination", "Result Publication"];

export const applications = [
  { id: "APP-2026-000101", name: "Amit Sharma", exam: "NRE-2026", category: "General", state: "Delhi", score: 85, status: "Approved" },
  { id: "APP-2026-000102", name: "Priyanka Patel", exam: "NRE-2026", category: "OBC", state: "Gujarat", score: 72, status: "Pending" },
  { id: "APP-2026-000103", name: "Vijay Kumar", exam: "SET-2026", category: "SC", state: "Tamil Nadu", score: 68, status: "Approved" },
  { id: "APP-2026-000104", name: "Ananya Rao", exam: "TEC-2026", category: "General", state: "Karnataka", score: 91, status: "Pending" },
  { id: "APP-2026-000105", name: "Rahul Singh", exam: "NRE-2026", category: "EWS", state: "Rajasthan", score: 79, status: "Rejected" }
];

export const formSections = [
  {
    title: "Personal Details",
    fields: [
      { label: "Full Name", type: "Text", placeholder: "Enter your full name", helpText: "As per class 10 certificate", required: true, visible: true, editable: true, searchable: true, eligibility: false, unique: false },
      { label: "Email", type: "Email", placeholder: "Enter email address", helpText: "For communications", required: true, visible: true, editable: true, searchable: true, eligibility: false, unique: true },
      { label: "Phone", type: "Phone", placeholder: "Enter phone number", helpText: "10-digit mobile number", required: true, visible: true, editable: true, searchable: false, eligibility: false, unique: true },
      { label: "Date of Birth", type: "Date", placeholder: "", helpText: "As per identity proof", required: true, visible: true, editable: true, searchable: false, eligibility: true, unique: false },
      { label: "Nationality", type: "Dropdown", placeholder: "Select nationality", helpText: "", required: true, visible: true, editable: true, searchable: false, eligibility: true, unique: false }
    ]
  },
  {
    title: "Education",
    fields: [
      { label: "Qualification", type: "Dropdown", placeholder: "Select highest qualification", helpText: "", required: true, visible: true, editable: true, searchable: false, eligibility: true, unique: false },
      { label: "University", type: "Text", placeholder: "Enter board/university name", helpText: "", required: true, visible: true, editable: true, searchable: false, eligibility: false, unique: false },
      { label: "Percentage", type: "Percentage", placeholder: "Enter aggregate percentage", helpText: "Minimum 60% for automatic approval", required: true, visible: true, editable: true, searchable: false, eligibility: true, unique: false },
      { label: "Passing Year", type: "Number", placeholder: "YYYY", helpText: "", required: true, visible: true, editable: true, searchable: false, eligibility: false, unique: false }
    ]
  },
  {
    title: "Documents",
    fields: [
      { label: "Photo", type: "Image Upload", placeholder: "", helpText: "JPG/PNG up to 2MB", required: true, visible: true, editable: true, searchable: false, eligibility: false, unique: false },
      { label: "Signature", type: "Image Upload", placeholder: "", helpText: "JPG/PNG up to 1MB", required: true, visible: true, editable: true, searchable: false, eligibility: false, unique: false },
      { label: "Identity Proof", type: "File Upload", placeholder: "", helpText: "PDF up to 5MB", required: true, visible: true, editable: true, searchable: false, eligibility: false, unique: false },
      { label: "Degree Certificate", type: "File Upload", placeholder: "", helpText: "PDF up to 5MB", required: true, visible: true, editable: true, searchable: false, eligibility: false, unique: false }
    ]
  }
];

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
  { label: "Total Examinations", value: 10, icon: GraduationCap, tone: "text-blue-700" },
  { label: "Total Candidates", value: 500, icon: Users, tone: "text-teal-700" },
  { label: "Applications", value: 500, icon: FileText, tone: "text-amber-700" },
  { label: "Approved", value: 318, icon: BadgeCheck, tone: "text-emerald-700" },
  { label: "Pending", value: 122, icon: FileClock, tone: "text-orange-700" },
  { label: "Rejected", value: 60, icon: FileCheck2, tone: "text-red-700" },
  { label: "Hall Tickets", value: 500, icon: Ticket, tone: "text-indigo-700" },
  { label: "Appeared", value: 432, icon: ClipboardCheck, tone: "text-cyan-700" }
];

export const registrationTrend = [
  { day: "Mon", registrations: 48, approved: 31 },
  { day: "Tue", registrations: 63, approved: 44 },
  { day: "Wed", registrations: 82, approved: 59 },
  { day: "Thu", registrations: 74, approved: 51 },
  { day: "Fri", registrations: 96, approved: 67 },
  { day: "Sat", registrations: 52, approved: 38 },
  { day: "Sun", registrations: 85, approved: 61 }
];

export const statusData = [
  { name: "Approved", value: 318 },
  { name: "Pending", value: 122 },
  { name: "Rejected", value: 60 }
];

export const exams = [
  {
    code: "NRE-2026",
    name: "National Recruitment Examination",
    department: "Administrative Services",
    phase: "Verification",
    dates: "12 Aug 2026 - 18 Aug 2026",
    applications: 142,
    status: "Active"
  },
  {
    code: "SET-2026",
    name: "State Eligibility Test",
    department: "Higher Education",
    phase: "Hall Ticket Release",
    dates: "02 Sep 2026",
    applications: 96,
    status: "Active"
  },
  {
    code: "TEC-2026",
    name: "Technical Engineer Cadre",
    department: "Public Works",
    phase: "Registration",
    dates: "01 Jul 2026 - 31 Jul 2026",
    applications: 184,
    status: "Open"
  }
];

export const phases = ["Registration", "Correction Window", "Verification", "Hall Ticket Release", "Online Examination", "Result Publication"];

export const applications = Array.from({ length: 12 }, (_, index) => ({
  id: `APP-2026-${String(index + 1).padStart(5, "0")}`,
  name: ["Aarav Sharma", "Diya Nair", "Kabir Khan", "Meera Iyer"][index % 4],
  exam: exams[index % exams.length].code,
  category: ["General", "OBC", "SC", "EWS"][index % 4],
  state: ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu"][index % 4],
  score: 58 + index * 2,
  status: ["Approved", "Pending", "Returned", "Rejected"][index % 4]
}));

export const formSections = [
  {
    title: "Personal Details",
    fields: ["Full Name", "Email", "Phone", "Date of Birth", "Nationality"]
  },
  {
    title: "Education",
    fields: ["Qualification", "University", "Percentage", "Passing Year"]
  },
  {
    title: "Documents",
    fields: ["Photo", "Signature", "Identity Proof", "Degree Certificate"]
  }
];

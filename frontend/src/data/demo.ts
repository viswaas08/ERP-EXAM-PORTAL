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

export const applications: Array<{
  id: string;
  name: string;
  exam: string;
  category: string;
  state: string;
  score: number;
  status: string;
}> = [];

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

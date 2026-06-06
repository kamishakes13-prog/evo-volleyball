export type InvoiceStatus = "unpaid" | "paid" | "partial" | "overdue" | "waived";
export type PaymentMethod =
  | "cash"
  | "zelle"
  | "venmo"
  | "cash app"
  | "card"
  | "other";

export type Team = {
  id: string;
  name: string;
  ageGroup: string;
  coach: string;
  maxPlayers: number;
  monthlyDues: number;
  schedule: string;
};

export type Player = {
  id: string;
  userId?: string;
  name: string;
  parent: string;
  phone: string;
  email: string;
  teamId: string;
  jersey: number;
  notes: string;
  active?: boolean;
};

export type Invoice = {
  id: string;
  playerId: string;
  title: string;
  category:
    | "monthly dues"
    | "tournament fee"
    | "uniform"
    | "camp"
    | "private session"
    | "custom";
  amount: number;
  paid: number;
  dueDate: string;
  status: InvoiceStatus;
  method?: PaymentMethod;
};

export type CoachAvailability = {
  coach: string;
  slots: string[];
};

export type PrivateSession = {
  id: string;
  type: "1-on-1" | "small group" | "skills training";
  price: number;
  coach: string;
  date: string;
  time: string;
  playerId: string;
  paymentStatus: InvoiceStatus;
};

export const teams: Team[] = [
  {
    id: "t-14-blue",
    name: "EVO 14 Blue",
    ageGroup: "14U",
    coach: "Maya Ortiz",
    maxPlayers: 12,
    monthlyDues: 275,
    schedule: "Mon/Wed 6:00 PM, Sat 10:00 AM",
  },
  {
    id: "t-15-white",
    name: "EVO 15 White",
    ageGroup: "15U",
    coach: "Andre Cole",
    maxPlayers: 12,
    monthlyDues: 295,
    schedule: "Tue/Thu 6:30 PM, Sun 1:00 PM",
  },
  {
    id: "t-17-elite",
    name: "EVO 17 Elite",
    ageGroup: "17U",
    coach: "Nina Park",
    maxPlayers: 10,
    monthlyDues: 325,
    schedule: "Mon/Thu 7:30 PM, Sat 12:00 PM",
  },
];

export const players: Player[] = [
  {
    id: "p-ava",
    name: "Ava Thompson",
    parent: "Kendra Thompson",
    phone: "(214) 555-0174",
    email: "kendra@example.com",
    teamId: "t-14-blue",
    jersey: 7,
    notes: "Setter. Prefers Monday private sessions.",
  },
  {
    id: "p-mia",
    name: "Mia Sanchez",
    parent: "Rosa Sanchez",
    phone: "(972) 555-0190",
    email: "rosa@example.com",
    teamId: "t-14-blue",
    jersey: 12,
    notes: "Needs uniform balance reminder.",
  },
  {
    id: "p-lena",
    name: "Lena Brooks",
    parent: "Chris Brooks",
    phone: "(469) 555-0168",
    email: "chris@example.com",
    teamId: "t-15-white",
    jersey: 4,
    notes: "Outside hitter. Cleared for tournament travel.",
  },
  {
    id: "p-skye",
    name: "Skye Patel",
    parent: "Mina Patel",
    phone: "(214) 555-0142",
    email: "mina@example.com",
    teamId: "t-17-elite",
    jersey: 22,
    notes: "Libero. Private session package active.",
  },
  {
    id: "p-nora",
    name: "Nora Kim",
    parent: "Daniel Kim",
    phone: "(817) 555-0139",
    email: "daniel@example.com",
    teamId: "t-17-elite",
    jersey: 9,
    notes: "College showcase target list in progress.",
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv-1001",
    playerId: "p-ava",
    title: "June Monthly Dues",
    category: "monthly dues",
    amount: 275,
    paid: 275,
    dueDate: "2026-06-10",
    status: "paid",
    method: "zelle",
  },
  {
    id: "inv-1002",
    playerId: "p-mia",
    title: "Uniform Kit",
    category: "uniform",
    amount: 180,
    paid: 75,
    dueDate: "2026-06-01",
    status: "partial",
    method: "venmo",
  },
  {
    id: "inv-1003",
    playerId: "p-lena",
    title: "June Monthly Dues",
    category: "monthly dues",
    amount: 295,
    paid: 0,
    dueDate: "2026-06-05",
    status: "overdue",
  },
  {
    id: "inv-1004",
    playerId: "p-skye",
    title: "Skills Training Session",
    category: "private session",
    amount: 85,
    paid: 85,
    dueDate: "2026-06-08",
    status: "paid",
    method: "cash app",
  },
  {
    id: "inv-1005",
    playerId: "p-nora",
    title: "Regional Tournament Fee",
    category: "tournament fee",
    amount: 225,
    paid: 0,
    dueDate: "2026-06-18",
    status: "unpaid",
  },
];

export const privateSessions: PrivateSession[] = [
  {
    id: "s-2001",
    type: "skills training",
    price: 85,
    coach: "Maya Ortiz",
    date: "2026-06-07",
    time: "4:00 PM",
    playerId: "p-ava",
    paymentStatus: "unpaid",
  },
  {
    id: "s-2002",
    type: "1-on-1",
    price: 95,
    coach: "Nina Park",
    date: "2026-06-08",
    time: "5:30 PM",
    playerId: "p-skye",
    paymentStatus: "paid",
  },
  {
    id: "s-2003",
    type: "small group",
    price: 55,
    coach: "Andre Cole",
    date: "2026-06-11",
    time: "6:00 PM",
    playerId: "p-lena",
    paymentStatus: "partial",
  },
];

export const availability: CoachAvailability[] = [
  {
    coach: "Maya Ortiz",
    slots: ["Mon 4:00 PM", "Wed 5:00 PM", "Sat 1:00 PM"],
  },
  {
    coach: "Andre Cole",
    slots: ["Tue 5:00 PM", "Thu 5:30 PM", "Sun 11:00 AM"],
  },
  {
    coach: "Nina Park",
    slots: ["Mon 5:30 PM", "Thu 4:30 PM", "Sat 2:00 PM"],
  },
];

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function teamRosterCount(teamId: string) {
  return players.filter((player) => player.teamId === teamId).length;
}

export function playerBalance(playerId: string) {
  return invoices
    .filter((invoice) => invoice.playerId === playerId)
    .reduce(
      (summary, invoice) => {
        summary.total += invoice.amount;
        summary.paid += invoice.paid;
        summary.remaining += Math.max(invoice.amount - invoice.paid, 0);
        return summary;
      },
      { total: 0, paid: 0, remaining: 0 },
    );
}

export function playerName(playerId: string) {
  return players.find((player) => player.id === playerId)?.name ?? "Unassigned";
}

export function teamName(teamId: string) {
  return teams.find((team) => team.id === teamId)?.name ?? "No team";
}

export const dashboard = {
  totalPlayers: players.length,
  activeTeams: teams.length,
  monthlyRevenue: invoices.reduce((total, invoice) => total + invoice.paid, 0),
  outstandingBalances: invoices.reduce(
    (total, invoice) => total + Math.max(invoice.amount - invoice.paid, 0),
    0,
  ),
  overdueInvoices: invoices.filter((invoice) => invoice.status === "overdue")
    .length,
  upcomingPrivateSessions: privateSessions.length,
  recentPayments: invoices
    .filter((invoice) => invoice.paid > 0)
    .slice(0, 3)
    .map((invoice) => ({
      id: invoice.id,
      player: playerName(invoice.playerId),
      amount: invoice.paid,
      method: invoice.method ?? "other",
      title: invoice.title,
    })),
};

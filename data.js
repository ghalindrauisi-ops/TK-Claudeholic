const SINFO_CONFIG = {
  appName: "SINFO.",
  teamName: "ClaudeHolic",
  saranFormUrl: "https://forms.gle/LINK-GOOGLE-FORM-ANDA",
  heroRollingWords: ["Lomba", "Workshop", "Event", "Kompetisi", "Kolaborasi"]
};

const DEFAULT_CURRENT_USER = {
  id: "u-me",
  name: "Raka Pratama",
  nim: "2306123456",
  email: "raka.pratama@ui.ac.id",
  faculty: "Fakultas Ilmu Komputer",
  major: "Sistem Informasi '23",
  headline: "Full-Stack Developer & Product Builder | UI '23",
  bio: "Mahasiswa Sistem Informasi Universitas Indonesia yang antusias membangun produk digital berdampak, ikut hackathon nasional, dan berkolaborasi lintas fakultas.",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  verified: true,
  skills: [
    { name: "React & Tailwind", endorsements: 18, endorsedByMe: false },
    { name: "Python & Flask", endorsements: 14, endorsedByMe: false },
    { name: "UI/UX Prototyping", endorsements: 11, endorsedByMe: false },
    { name: "Product Pitching", endorsements: 9, endorsedByMe: false }
  ],
  experiences: [
    {
      role: "Lead Frontend Engineer",
      org: "COMPFEST UI — Software Engineering Academy",
      period: "2025 - Sekarang",
      desc: "Merancang antarmuka responsif berbasis Tailwind CSS dan mengintegrasikan API Python Flask."
    },
    {
      role: "Finalis Hackathon Nasional",
      org: "GEMASTIK — Divisi Pengembangan Perangkat Lunak",
      period: "2025",
      desc: "Membangun solusi smart-campus kolaborasi mahasiswa dalam waktu 48 jam."
    }
  ],
  achievements: [
    "Juara 2 Hackathon Inovasi Digital Mahasiswa 2025",
    "Sertifikasi Google UX Design & Cloud Foundations",
    "Terverifikasi SSO Mahasiswa Aktif UI"
  ]
};

const INITIAL_STUDENTS = [
  {
    id: "u-1",
    name: "Nadia Putri",
    faculty: "Fakultas Ilmu Komputer",
    major: "Ilmu Komputer '23",
    headline: "UI/UX Designer & Design System Enthusiast",
    bio: "Fokus pada user research, Figma prototyping, dan desain produk yang ramah pengguna.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    verified: true,
    friendStatus: "connected",
    matchScore: 85,
    skills: [
      { name: "Figma & Prototyping", endorsements: 24, endorsedByMe: true },
      { name: "Design Thinking", endorsements: 16, endorsedByMe: false },
      { name: "Frontend HTML/CSS", endorsements: 12, endorsedByMe: false }
    ],
    experiences: [
      { role: "Product Designer", org: "RISTEK Fasilkom UI", period: "2025 - Sekarang", desc: "Memimpin desain antarmuka untuk platform kemahasiswaan." }
    ],
    achievements: ["Best UI/UX Design — National Technopreneur 2025"]
  },
  {
    id: "u-2",
    name: "Dimas Saputra",
    faculty: "Fakultas Ekonomi dan Bisnis",
    major: "Manajemen '22",
    headline: "Business Strategist & Pitch Deck Specialist",
    bio: "Berpengalaman menyusun model bisnis, riset pasar, dan pitching untuk kompetisi Business Case.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    verified: true,
    friendStatus: "connected",
    matchScore: 98,
    skills: [
      { name: "Business Model Canvas", endorsements: 21, endorsedByMe: false },
      { name: "Financial Modeling", endorsements: 15, endorsedByMe: false },
      { name: "Public Speaking", endorsements: 19, endorsedByMe: true }
    ],
    experiences: [
      { role: "Project Manager", org: "UI Business Case Club", period: "2024 - Sekarang", desc: "Koordinator tim kompetisi bisnis tingkat Asia Tenggara." }
    ],
    achievements: ["1st Winner National Business Plan Competition 2025"]
  },
  {
    id: "u-3",
    name: "Alya Rahmadani",
    faculty: "Fakultas Teknik",
    major: "Teknik Komputer '23",
    headline: "AI/ML Engineer & Backend Python Developer",
    bio: "Membangun model machine learning, REST API cepat dengan Python, dan integrasi IoT.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    verified: true,
    friendStatus: "none",
    matchScore: 98,
    skills: [
      { name: "Python & FastAPI", endorsements: 27, endorsedByMe: false },
      { name: "Machine Learning", endorsements: 20, endorsedByMe: false },
      { name: "Data Analytics", endorsements: 14, endorsedByMe: false }
    ],
    experiences: [
      { role: "AI Research Assistant", org: "Lab Komputasi Cerdas FTUI", period: "2025 - Sekarang", desc: "Pengembangan model NLP Bahasa Indonesia." }
    ],
    achievements: ["Finalis GEMASTIK Divisi Data Mining 2025"]
  },
  {
    id: "u-4",
    name: "Farhan Wijaya",
    faculty: "Fakultas Ilmu Komputer",
    major: "Sistem Informasi '24",
    headline: "Mobile & Web Developer | Tailwind & React",
    bio: "Suka membangun aplikasi cepat dan rapi untuk kebutuhan mahasiswa sehari-hari.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    verified: true,
    friendStatus: "none",
    matchScore: 80,
    skills: [
      { name: "Tailwind CSS", endorsements: 17, endorsedByMe: false },
      { name: "JavaScript ES6+", endorsements: 15, endorsedByMe: false },
      { name: "Git & DevOps", endorsements: 10, endorsedByMe: false }
    ],
    experiences: [
      { role: "Web Developer", org: "BEM Fasilkom UI", period: "2025 - Sekarang", desc: "Mengelola portal informasi kegiatan mahasiswa." }
    ],
    achievements: ["Top 10 Web Dev Challenge 2025"]
  },
  {
    id: "u-5",
    name: "Salsabila Azzahra",
    faculty: "Fakultas Ilmu Sosial dan Ilmu Politik",
    major: "Ilmu Komunikasi '23",
    headline: "Content Strategist, Branding & Copywriting",
    bio: "Membantu tim teknologi mengemas ide kompleks menjadi cerita yang mudah dipahami juri.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    verified: true,
    friendStatus: "none",
    matchScore: 98,
    skills: [
      { name: "Storytelling & Pitch", endorsements: 22, endorsedByMe: false },
      { name: "Social Media Strategy", endorsements: 18, endorsedByMe: false },
      { name: "UX Writing", endorsements: 13, endorsedByMe: false }
    ],
    experiences: [
      { role: "Creative Lead", org: "UI Innovation Festival", period: "2025", desc: "Mengatur kampanye publikasi untuk 3.000+ peserta." }
    ],
    achievements: ["Best Presenter — National Social Innovation 2025"]
  }
];

const INITIAL_POSTS = [
  {
    id: "post-1",
    type: "Lomba",
    category: "Hackathon & Software",
    title: "GEMASTIK XIX — Pengembangan Perangkat Lunak",
    organizer: "Kemendikbudristek & Puspresnas",
    deadline: "2026-12-02T23:59:00",
    deadlineLabel: "2 Des 2026 • 23:59 WIB",
    location: "Hybrid / Nasional",
    prize: "Total Hadiah Rp 75.000.000 + Medali",
    description: "Tim lintas jurusan mencari 1 Backend Python / AI Engineer untuk menyempurnakan prototipe aplikasi kampus cerdas sebelum babak penyisihan.",
    maxSlots: 4,
    memberIds: ["u-1", "u-2", "u-4"],
    neededRoles: ["Backend Python / AI"],
    saved: true
  },
  {
    id: "post-2",
    type: "Lomba",
    category: "UI/UX & Product",
    title: "COMPFEST UI — UX Design Competition 2026",
    organizer: "Fasilkom Universitas Indonesia",
    deadline: "2026-11-29T18:00:00",
    deadlineLabel: "29 Nov 2026 • 18:00 WIB",
    location: "Depok & Online",
    prize: "Rp 20.000.000 + Mentoring Industry",
    description: "Skuad sudah lengkap dengan Researcher & Hustler! Kami sudah punya Raka dan Nadia di tim, siap menuju tahap semifinal.",
    maxSlots: 3,
    memberIds: ["u-me", "u-1"],
    neededRoles: ["UX Writer / Prototyper"],
    saved: true
  },
  {
    id: "post-3",
    type: "Lomba",
    category: "Business Case",
    title: "ASEAN Youth Business Innovation Challenge",
    organizer: "FEB UI & ASEAN Student Network",
    deadline: "2026-12-10T23:59:00",
    deadlineLabel: "10 Des 2026 • 23:59 WIB",
    location: "Jakarta & Singapura",
    prize: "USD 3,500 + Full Funded Trip",
    description: "Mencari anggota yang kuat di analisis finansial dan deck visual untuk solusi green-economy kampus.",
    maxSlots: 4,
    memberIds: ["u-2", "u-5"],
    neededRoles: ["Financial Analyst", "Deck Designer"],
    saved: false
  },
  {
    id: "post-4",
    type: "Workshop",
    category: "Web & Cloud",
    title: "Hands-On Workshop: Tailwind CSS + Python Flask Full-Stack",
    organizer: "RISTEK x Google Developer Student Club UI",
    deadline: "2026-11-30T13:00:00",
    deadlineLabel: "30 Nov 2026 • 13:00 WIB",
    location: "Auditorium Gedung Baru Fasilkom UI",
    prize: "E-Sertifikat + Starter Kit Deployment",
    description: "Belajar membangun aplikasi web modern dari nol menggunakan Tailwind CSS dan backend Python Flask hingga siap dipublikasikan online.",
    maxSlots: 1,
    memberIds: ["u-3"],
    neededRoles: ["Peserta Individu (Solo)"],
    saved: true
  },
  {
    id: "post-5",
    type: "Workshop",
    category: "AI & Data",
    title: "Bootcamp Kilat: Membangun AI Assistant Kampus",
    organizer: "Lab Komputasi Cerdas FTUI",
    deadline: "2026-12-06T09:00:00",
    deadlineLabel: "6 Des 2026 • 09:00 WIB",
    location: "Engineering Center FTUI",
    prize: "Sertifikat + Akses GPU Cloud",
    description: "Sesi praktik langsung merancang RAG pipeline dan integrasi API untuk kebutuhan riset mahasiswa.",
    maxSlots: 1,
    memberIds: ["u-1"],
    neededRoles: ["Peserta Individu (Solo)"],
    saved: false
  },
  {
    id: "post-6",
    type: "Event",
    category: "Networking & Expo",
    title: "UI Innovation & Startup Demo Day 2026",
    organizer: "Direktorat Inovasi & Science Techno Park UI",
    deadline: "2026-12-04T10:00:00",
    deadlineLabel: "4 Des 2026 • 10:00 WIB",
    location: "Balairung Universitas Indonesia",
    prize: "Gratis + Networking Investor & Inkubator",
    description: "Pameran 50+ produk karya mahasiswa lintas fakultas, sesi pitching terbuka, dan matchmaking tim untuk kompetisi nasional.",
    maxSlots: 1,
    memberIds: ["u-2"],
    neededRoles: ["Terbuka untuk Semua Mahasiswa"],
    saved: false
  },
  {
    id: "post-7",
    type: "Event",
    category: "Tech Talk",
    title: "Campus Career & Hackathon Kickoff Night",
    organizer: "BEM UI x Mitra Teknologi",
    deadline: "2026-12-12T18:30:00",
    deadlineLabel: "12 Des 2026 • 18:30 WIB",
    location: "Perpustakaan Pusat UI (Apung)",
    prize: "Merchandise Eksklusif & Makan Malam",
    description: "Ngobrol santai bareng alumni juara lomba nasional dan cari partner tim sebelum musim kompetisi semester genap dimulai.",
    maxSlots: 1,
    memberIds: ["u-5"],
    neededRoles: ["Terbuka untuk Semua Mahasiswa"],
    saved: false
  }
];

const INITIAL_APPLICANTS = [
  {
    id: "app-101",
    applicantId: "u-3",
    postId: "post-2",
    roleApplied: "UX Writer / Prototyper",
    pitch: "Halo Raka & Nadia! Saya biasa menyusun alur interaksi aplikasi dan microcopy yang jelas. Boleh ikut gabung melengkapi slot terakhir?",
    timeAgo: "12 menit lalu",
    status: "pending"
  },
  {
    id: "app-102",
    applicantId: "u-4",
    postId: "post-2",
    roleApplied: "Frontend & Interactive Prototype",
    pitch: "Saya siap bantu bikin prototipe interaktif berbasis Tailwind CSS supaya presentasi ke juri lebih hidup!",
    timeAgo: "1 jam lalu",
    status: "pending"
  }
];

const INITIAL_FRIEND_REQUESTS = [
  {
    id: "fr-201",
    fromUserId: "u-3",
    note: "Satu angkatan '23, yuk konek buat barengan proyek AI & lomba!",
    timeAgo: "25 menit lalu"
  },
  {
    id: "fr-202",
    fromUserId: "u-5",
    note: "Halo Raka, aku lihat portofolio frontend kamu keren. Konek yuk!",
    timeAgo: "3 jam lalu"
  }
];

const CLAUDEHOLIC_CREATORS = [
  {
    name: "Kisah",
    role: "Product Architect & Frontend",
    instagram: "@kisah",
    instagramUrl: "https://instagram.com/username_kisah",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/20240527_Karina_%28aespa%29.jpg/800px-20240527_Karina_%28aespa%29.jpg",
    fallback: "https://api.dicebear.com/9.x/glass/svg?seed=Kisah"
  },
  {
    name: "Cindy",
    role: "UI/UX Designer & Research",
    instagram: "@cindy",
    instagramUrl: "https://instagram.com/username_cindy",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/20240527_Karina_%28aespa%29.jpg/800px-20240527_Karina_%28aespa%29.jpg",
    fallback: "https://api.dicebear.com/9.x/glass/svg?seed=Cindy"
  },
  {
    name: "Ghalindra",
    role: "Backend & System Integration",
    instagram: "@ghalindra",
    instagramUrl: "https://instagram.com/username_ghalindra",
    photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/20240527_Karina_%28aespa%29.jpg/800px-20240527_Karina_%28aespa%29.jpg",
    fallback: "https://api.dicebear.com/9.x/glass/svg?seed=Ghalindra"
  }
];

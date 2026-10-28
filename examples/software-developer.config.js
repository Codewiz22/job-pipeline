// examples/software-developer.config.js
// A second example: remote software developer roles. To use it, copy this
// file over career.config.js (or to career.config.local.js to keep it
// private) and fill in the kit.

const config = {
  appName: "Job Pipeline",
  tagline: "Remote developer roles from five job boards, scored for your stack.",

  titles: {
    include: ["engineer", "developer", "programmer", "frontend", "front-end", "front end", "backend", "back-end", "back end", "full stack", "full-stack", "fullstack", "react", "mobile"],
    exclude: ["sales", "support", "recruiter", "mechanical", "electrical", "civil", "hardware", "manufacturing", "process", "quality", "field", "test technician"],
  },

  penaliseTitles: ["director", "head of", "vp", "vice president", "principal", "chief", "manager", "intern"],

  home: { label: "", keywords: [] },

  profiles: {
    frontend: {
      label: "Frontend",
      titles: [
        ["frontend", 50], ["front-end", 50], ["front end", 50],
        ["react developer", 50], ["react engineer", 50],
        ["ui engineer", 45], ["web developer", 40],
        ["full stack", 30], ["full-stack", 30], ["fullstack", 30],
        ["engineer", 15], ["developer", 15],
      ],
      skills: ["react", "next.js", "typescript", "javascript", "css", "tailwind", "accessibility", "redux", "vue", "storybook", "figma", "performance"],
      pitch: `Hi {company} team,

I'm {name}, a frontend developer, and I'd love to be considered for the {title} role.

I build fast, accessible interfaces with React and TypeScript. [Add a sentence about your most relevant recent project.]

You can see my work at {portfolio}. I'd be glad to talk through how I'd contribute at {company}.

Thanks,
{name}`,
    },
    backend: {
      label: "Backend",
      titles: [
        ["backend", 50], ["back-end", 50], ["back end", 50],
        ["api engineer", 48], ["platform engineer", 42],
        ["node.js", 45], ["python developer", 45], ["golang", 45],
        ["full stack", 30], ["full-stack", 30], ["fullstack", 30],
        ["engineer", 15], ["developer", 15],
      ],
      skills: ["node.js", "python", "go", "postgres", "postgresql", "sql", "aws", "docker", "kubernetes", "api", "microservices", "redis", "graphql"],
      pitch: `Hi {company} team,

I'm {name}, a backend developer, and I'd love to be considered for the {title} role.

I design and run reliable APIs and services. [Add a sentence about your most relevant recent project.]

You can see my work at {portfolio}. I'd be glad to talk through how I'd contribute at {company}.

Thanks,
{name}`,
    },
    mobile: {
      label: "Mobile",
      titles: [
        ["react native", 50], ["mobile developer", 50], ["mobile engineer", 50],
        ["ios", 46], ["android", 46], ["flutter", 46],
        ["engineer", 15], ["developer", 15],
      ],
      skills: ["react native", "expo", "swift", "kotlin", "flutter", "ios", "android", "app store", "typescript", "mobile"],
      pitch: `Hi {company} team,

I'm {name}, a mobile developer, and I'd love to be considered for the {title} role.

I ship polished iOS and Android apps. [Add a sentence about your most relevant recent project.]

You can see my work at {portfolio}. I'd be glad to talk through how I'd contribute at {company}.

Thanks,
{name}`,
    },
  },

  sources: {
    himalayas: ["frontend developer", "backend developer", "react native"],
    weworkremotely: ["remote-front-end-programming-jobs", "remote-back-end-programming-jobs", "remote-full-stack-programming-jobs"],
    jobicy: { industries: ["dev"], tags: [] },
    remoteok: ["dev"],
    remotive: ["software-dev"],
  },

  kit: {
    name: "",
    email: "",
    phone: "",
    location: "",
    portfolio: "",
    otherLink: "",
    linkedin: "",
    rightToWork: "",
    availability: "I can start within two weeks.",
    salary: "",
    followUp: `Hi {company} team,

I applied for the {title} role on {appliedDate} and wanted to follow up. I'm still very interested and happy to answer any questions.

Thanks,
{name}`,
  },

  followUpDays: 7,

  outreach: {
    enabled: true,
    maxTeamSize: 50,
    industries: ["B2B", "Fintech", "Consumer"],
    keywords: ["api", "platform", "mobile", "app", "developer", "saas", "ai", "marketplace"],
    dm: `Hi! I came across {company} ({oneLiner}) and really like what you're building.

I'm {name}, a developer who ships product features end to end. [Add one line about a recent project.]

My work: {portfolio}

Would you be open to a quick chat about how I could help {company}? I'm happy to start with a small paid trial.

{name}`,
    dmFollowUp: `Hi again! Just bumping this in case it got buried. I'd still love to help {company} ship. My work: {portfolio}

{name}`,
  },
};

export default config;

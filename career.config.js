// career.config.js
// Everything that makes this app yours lives here: the roles you want, how
// jobs are scored, where you live, which searches run on each job board, and
// the details and cover notes in your Apply kit.
//
// This example is set up for remote design roles. For another career, change
// the title words, profiles and source searches. See
// examples/software-developer.config.js for a full second example.
//
// Word lists match whole words, ignoring case. Title rules also accept a
// RegExp when you need more control.

const config = {
  appName: "Job Pipeline",
  tagline: "Remote design roles from five job boards, scored for your profiles.",

  // Which job titles count at all. A title must contain one of the include
  // words and none of the exclude words.
  titles: {
    include: ["designer", "design", "ux", "ui", "graphic", "graphics", "illustrator", "illustration", "art director", "visual", "motion"],
    exclude: ["engineer", "engineering", "developer", "architect", "instructional", "learning", "interior", "mechanical", "electrical", "civil", "structural", "hardware", "circuit", "chip", "data", "sales", "account executive", "recruiter", "solutions", "clinical", "lighting", "landscape", "fashion", "apparel", "merchandiser", "level designer", "curriculum", "technical writer"],
  },

  // Titles that lose 10 points (roles more senior than you're after).
  // Leave empty to turn this off.
  penaliseTitles: ["director", "head of", "vp", "vice president", "principal", "chief", "manager"],

  // Where you live. Jobs that name one of these get the biggest location
  // boost. Jobs that only name other places are marked location-restricted
  // and hidden by default. Leave keywords empty to skip location filtering.
  // Example for Nigeria: { label: "Nigeria", keywords: ["nigeria", "lagos", "africa", "emea", "wat"] }
  home: { label: "", keywords: [] },

  // The kinds of work you do. Every job is scored 0-100 against each profile
  // and filed under its best one. Add, remove or rename profiles freely.
  //   titles: [phrase or RegExp, points]. The first match wins, so put the
  //           most specific phrases first. Up to 50 points.
  //   skills: words looked for in the description, 5 points each, up to 35.
  //   pitch:  the cover note for this profile.
  profiles: {
    uiux: {
      label: "UI/UX",
      titles: [
        [/\bui\s*[\/&+,]?\s*ux\b|\bux\s*[\/&+,]?\s*ui\b/, 50],
        ["product designer", 48],
        ["product design", 48],
        ["ux", 45],
        ["user experience", 45],
        ["ui", 45],
        ["user interface", 45],
        ["web designer", 42],
        ["website designer", 42],
        ["app designer", 42],
        ["mobile designer", 42],
        ["interaction designer", 40],
        ["digital designer", 36],
        ["designer", 18],
        ["design", 18],
      ],
      skills: ["figma", "prototype", "prototyping", "wireframe", "wireframes", "user research", "usability", "design system", "user flow", "user flows", "mobile app", "onboarding", "landing page", "saas", "interaction", "responsive", "accessibility", "user journey", "web app"],
      pitch: `Hi {company} team,

I'm {name}, a UI/UX designer, and I'd love to be considered for the {title} role.

I design digital products end to end, from user flows and wireframes to polished, responsive screens. [Add a sentence about your most relevant recent project.]

You can see my work at {portfolio}. I'd be glad to talk through how I'd approach {company}'s product.

Thanks,
{name}`,
    },
    brand: {
      label: "Brand & Graphic",
      titles: [
        ["brand designer", 50],
        ["brand design", 50],
        ["branding", 50],
        ["brand identity", 50],
        ["graphic designer", 46],
        ["graphic design", 46],
        ["logo", 44],
        ["identity designer", 44],
        ["visual designer", 42],
        ["visual design", 42],
        ["brand", 40],
        ["creative designer", 38],
        ["marketing designer", 38],
        ["presentation designer", 38],
        ["packaging", 34],
        ["print designer", 34],
        [/illustrat/, 30],
        ["designer", 18],
        ["design", 18],
      ],
      skills: ["brand identity", "branding", "logo", "typography", "illustrator", "photoshop", "indesign", "print", "packaging", "merch", "brand guidelines", "visual identity", "adobe creative", "graphic design"],
      pitch: `Hi {company} team,

I'm {name}, a brand and graphic designer, and I'd love to be considered for the {title} role.

I build visual identities that hold together everywhere they show up. [Add a sentence about your most relevant recent project.]

My portfolio is at {portfolio}. I'd be glad to show how I'd bring the same care to {company}'s brand.

Thanks,
{name}`,
    },
    social: {
      label: "Social media",
      titles: [
        ["social media designer", 50],
        ["social designer", 50],
        ["social media design", 50],
        ["social content", 50],
        ["social", 44],
        ["marketing designer", 42],
        ["growth designer", 42],
        ["performance designer", 42],
        ["ad designer", 42],
        ["ads designer", 42],
        ["campaign", 42],
        ["content designer", 36],
        ["graphic designer", 36],
        ["motion designer", 30],
        ["motion graphics", 30],
        ["video", 30],
        ["designer", 18],
        ["design", 18],
      ],
      skills: ["social media", "instagram", "tiktok", "linkedin", "canva", "campaign", "campaigns", "paid ads", "ad creative", "content calendar", "engagement", "carousel", "thumbnail", "after effects", "community"],
      pitch: `Hi {company} team,

I'm {name}, a designer who creates social media campaigns, and I'd love to be considered for the {title} role.

I design scroll-stopping posts and campaigns that grow communities and stay on-brand across every format. [Add a sentence about your most relevant recent project.]

You can see my work at {portfolio}. I'd love to help {company} grow its audience.

Thanks,
{name}`,
    },
  },

  // What to ask each job board for. Use [] or null to switch a board off.
  sources: {
    himalayas: ["designer", "ux designer", "brand designer"], // search terms
    weworkremotely: ["remote-design-jobs"], // category feed names, from weworkremotely.com/categories
    jobicy: { industries: ["design-multimedia"], tags: ["designer"] },
    remoteok: ["design"], // tags
    remotive: ["design"], // categories
  },

  // Your Apply kit defaults. Anyone using the app can change these in
  // Settings; their changes are saved in their own browser.
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

I applied for the {title} role on {appliedDate} and wanted to follow up. I'm still very interested and happy to share more work or answer any questions.

Portfolio: {portfolio}

Thanks,
{name}`,
  },

  // Days after applying (or sending a DM) before a follow-up reminder appears.
  followUpDays: 7,

  // Startups to cold DM: YC companies that are hiring, ranked by how likely
  // they are to need you. Set enabled to false to hide the Startups tab.
  //   maxTeamSize: skip bigger companies (they usually hire through job posts)
  //   industries:  YC industries that get a boost
  //   keywords:    words in a startup's pitch or tags that get a boost
  //   dm / dmFollowUp: messages. They fill in {company}, {oneLiner}, {name}
  //                and {portfolio}.
  outreach: {
    enabled: true,
    maxTeamSize: 50,
    industries: ["Consumer", "Education", "Fintech"],
    keywords: ["consumer", "mobile", "app", "marketplace", "community", "creator", "social", "education", "learning", "brand", "design", "e-commerce", "ecommerce"],
    dm: `Hi! I came across {company} ({oneLiner}) and really like what you're building.

I'm {name}, a product and brand designer. Early teams often need someone who can own the product UI, the brand and the launch visuals, and that's what I do. [Add one line about a recent project.]

My work: {portfolio}

Would you be open to a quick chat about how I could help {company}? I'm happy to start with a small paid trial.

{name}`,
    dmFollowUp: `Hi again! Just bumping this in case it got buried. I'd still love to help {company} with design. My work: {portfolio}

{name}`,
  },
};

export default config;

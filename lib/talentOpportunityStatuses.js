export const TALENT_OPPORTUNITY_STATUSES = [
  {
    value: "actively_looking",
    label: "Actively Looking",
    description: "I'm ready for my next opportunity and actively exploring roles.",
  },
  {
    value: "open_to_opportunities",
    label: "Open to Opportunities",
    description: "I'm happy where I am, but open to hearing about the right opportunity.",
  },
  {
    value: "job_curious",
    label: "Job Curious",
    description: "I'm not looking to move, but I'm curious what opportunities are out there.",
  },
  {
    value: "open_to_contract_work",
    label: "Open to Contract Work",
    description: "Available or interested in contract, consulting or project-based opportunities.",
  },
  {
    value: "open_to_a_chat",
    label: "Open to a Chat",
    description: "Not necessarily looking for a new role, but happy to connect and have a conversation.",
  },
  {
    value: "not_looking",
    label: "Not Looking",
    description: "I'm not currently interested in changing roles, but I'm happy to maintain a Talent Hub profile.",
  },
];

export const DEFAULT_TALENT_OPPORTUNITY_STATUS = "open_to_opportunities";

export const TALENT_OPPORTUNITY_STATUS_VALUES = new Set(
  TALENT_OPPORTUNITY_STATUSES.map((status) => status.value)
);

export function getTalentOpportunityStatus(value) {
  return TALENT_OPPORTUNITY_STATUSES.find((status) => status.value === value) || null;
}
export const readinessCategories = [
  {
    id: "content-discoverability",
    index: "01",
    checks: 7,
    title: "Content discoverability",
    description: "Can agents locate and parse the documentation index and its linked resources?",
  },
  {
    id: "markdown-availability",
    index: "02",
    checks: 2,
    title: "Markdown availability",
    description: "Can agents retrieve clean markdown instead of parsing heavy page chrome?",
  },
  {
    id: "page-size",
    index: "03",
    checks: 4,
    title: "Page size",
    description: "Will content fit into an agent context window without losing critical information?",
  },
  {
    id: "content-structure",
    index: "04",
    checks: 3,
    title: "Content structure",
    description: "Are headings, tabs, and code blocks serialized into an understandable order?",
  },
  {
    id: "url-stability",
    index: "05",
    checks: 2,
    title: "URL stability",
    description: "Do documentation URLs resolve predictably without broken links or redirect traps?",
  },
  {
    id: "observability",
    index: "06",
    checks: 3,
    title: "Observability",
    description: "Is agent-facing content complete, fresh, cache-aware, and consistent with human pages?",
  },
  {
    id: "authentication",
    index: "07",
    checks: 2,
    title: "Authentication",
    description: "Can agents reach useful documentation without being blocked by an authentication wall?",
  },
] as const;
export const categoryLabels = Object.fromEntries(
  readinessCategories.map((category) => [category.id, category.title]),
) as Record<string, string>;

export const readinessPrinciples = [
  {
    title: "Human-readable is not agent-readable",
    description:
      "Most websites are built for human eyes. Interactive navigation, client rendering, and visual-only context can hide the product from automated systems.",
  },
  {
    title: "Documentation becomes a product interface",
    description:
      "Agent-readable docs explain a product so agents can understand, compare, use, test, and recommend it.",
  },
  {
    title: "The actual readiness question",
    description:
      "Can an agent discover what this product does, understand the actions available, safely call those actions, and return useful output?",
  },
  {
    title: "Readiness creates competitive advantage",
    description:
      "Websites are becoming interfaces for agents, not only pages for humans. AI readiness will define which businesses agents can confidently choose and use.",
  },
] as const;

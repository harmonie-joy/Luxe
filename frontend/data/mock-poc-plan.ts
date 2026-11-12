export const mockPocPlan = {
  title: "Plan & Capture",
  steps: [
    { field: "objective", label: "Goal", question: "What should this piece achieve?", placeholder: "Start a useful conversation, teach one thing, build trust..." },
    { field: "audience", label: "Audience", question: "Who is this for?", placeholder: "One person or group you want to reach..." },
    { field: "angle", label: "Angle", question: "What is the one thing you want to say?", placeholder: "A story, question, useful lesson, or unfinished thought..." },
    { field: "format", label: "Format", question: "What shape feels right?", placeholder: "Choose a format" },
  ],
  formats: ["Text post", "Carousel", "Image", "Short video"],
} as const;
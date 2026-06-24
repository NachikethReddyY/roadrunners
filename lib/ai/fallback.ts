import type { AiNodeOutput } from "@/lib/schemas/ai";

const INTERACTIVE_BY_SKILL: Record<string, AiNodeOutput["playground"]> = {
  react: {
    template: "react-ts",
    files: {
      "App.tsx": `export default function App() {
  return <h1>Hello from React!</h1>;
}
`,
    },
    activeFile: "App.tsx",
    preview: true,
    completion: "manual",
  },
  javascript: {
    template: "vanilla",
    files: {
      "index.js": "console.log('Hello from JavaScript!');\n",
      "index.html": `<!DOCTYPE html>
<html>
  <body>
    <p>Open the console to see output.</p>
    <script src="index.js"></script>
  </body>
</html>
`,
    },
    activeFile: "index.js",
    preview: true,
    completion: "manual",
  },
  typescript: {
    template: "vanilla",
    files: {
      "index.ts": "const greeting: string = 'Hello TypeScript!';\nconsole.log(greeting);\n",
    },
    activeFile: "index.ts",
    preview: false,
    completion: "manual",
  },
  "python-data": {
    template: "python",
    files: {
      "main.py": "print('Hello from Python!')\n",
    },
    activeFile: "main.py",
    preview: false,
    completion: "manual",
  },
};

export function getFallbackNode(skillTag = "explore"): AiNodeOutput {
  const playground = INTERACTIVE_BY_SKILL[skillTag];

  if (playground) {
    return {
      title: `Try ${skillTag} hands-on`,
      content_md:
        "The AI path is temporarily unavailable. Use the workspace below to experiment, then pick your next direction.",
      skill_tag: skillTag,
      node_type: "interactive",
      playground,
      choices: [
        {
          label: "Keep practicing",
          description: "Stay on this skill",
          target_skill_tag: skillTag,
        },
        {
          label: "Explore another path",
          description: "Branch to something new",
          target_skill_tag: "explore",
        },
      ],
    };
  }

  return {
    title: "Explore your next step",
    content_md:
      "The AI path is temporarily unavailable. Here is a suggested starting point — pick a direction below and we will build your journey from here.",
    skill_tag: skillTag,
    node_type: "choice",
    choices: [
      {
        label: "Learn React basics",
        description: "Components, JSX, and props",
        target_skill_tag: "react",
      },
      {
        label: "Try TypeScript fundamentals",
        description: "Types, interfaces, and narrowing",
        target_skill_tag: "typescript",
      },
      {
        label: "Understand HTTP & APIs",
        description: "REST, JSON, and fetch",
        target_skill_tag: "apis",
      },
    ],
  };
}

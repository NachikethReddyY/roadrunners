import type { ScrimSlide } from "@/lib/schemas/playground";

export type CoachInput = {
  code: string;
  output: string;
  activeSlide?: ScrimSlide | null;
  template?: string;
};

export type CoachHint = {
  title: string;
  concept: string;
  nudge: string;
  example: string;
};

function hasUnclosedQuote(code: string): boolean {
  const single = (code.match(/'/g) ?? []).length;
  const double = (code.match(/"/g) ?? []).length;
  return single % 2 === 1 || double % 2 === 1;
}

function hasUnbalancedParens(code: string): boolean {
  const opens = (code.match(/\(/g) ?? []).length;
  const closes = (code.match(/\)/g) ?? []).length;
  return opens !== closes;
}

export function buildTeachCoachHint(input: CoachInput): CoachHint {
  const code = input.code.trim();
  const output = input.output.trim();
  const slideTitle = input.activeSlide?.title ?? "this concept";
  const lowerOutput = output.toLowerCase();

  if (!code) {
    return {
      title: "Start with one tiny line",
      concept: `Right now the lesson is about ${slideTitle}.`,
      nudge:
        "Type one expression before running. For text output, you want a function call: a name, then the value you want it to use.",
      example: `Example pattern: show("sample text")`,
    };
  }

  if (lowerOutput.includes("syntaxerror") || hasUnclosedQuote(code) || hasUnbalancedParens(code)) {
    return {
      title: "Python is stuck reading the shape",
      concept:
        "A syntax error means Python could not understand the structure yet, so it has not started running your idea.",
      nudge:
        "Check the matching pairs first: quotes around text, then the function call wrapper around the value. Fix the shape, then run again.",
      example: `Adjacent example: say("good morning")`,
    };
  }

  if (lowerOutput.includes("nameerror") || lowerOutput.includes("isn't defined")) {
    return {
      title: "Python needs a known name",
      concept:
        "A name error means Python saw a word and tried to treat it like something you created earlier.",
      nudge:
        "If the word is text for a human, put it inside quotes. If it is a variable, define it before using it.",
      example: `Adjacent example: city = "Lagos"\nsay(city)`,
    };
  }

  if (lowerOutput.includes("no output")) {
    return {
      title: "Your code ran, but stayed quiet",
      concept:
        "Python can calculate or store values without showing anything. The console only changes when code asks to display a value.",
      nudge:
        "Use a display function when the goal is to see a message in the terminal.",
      example: `Adjacent example: show("practice message")`,
    };
  }

  if (input.activeSlide?.id === "variables") {
    return {
      title: "Variables are labels for values",
      concept:
        "A variable lets you give a value a short name, then reuse that name later.",
      nudge:
        "Keep the value in quotes when it is text. Then use the variable name without quotes when you want the stored value.",
      example: `Adjacent example: food = "rice"\nsay(food)`,
    };
  }

  return {
    title: "Think in two steps",
    concept: `This part is teaching ${slideTitle}.`,
    nudge:
      "First ask what value you want Python to work with. Then ask what action should happen to that value.",
    example: `Adjacent example: action("sample value")`,
  };
}

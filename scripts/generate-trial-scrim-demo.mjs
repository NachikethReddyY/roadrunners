#!/usr/bin/env node
/**
 * Generates a silent trial MP4 from the hello-react scrim timeline.
 * Usage: npm run generate:trial-mp4
 * Output: public/demo/roadrunners-trial-scrim.mp4
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const ROOT = process.cwd();
const TMP = join(ROOT, ".tmp-trial-mp4");
const OUT_DIR = join(ROOT, "public", "demo");
const OUT_FILE = join(OUT_DIR, "roadrunners-trial-scrim.mp4");

const DURATION = 12;
const W = 1280;
const H = 720;

const slides = [
  { start: 0, end: 3, title: "Hello React Scrim", caption: "Welcome to your first React scrim on RoadRunners.", code: `export default function App() {\n  return <h1></h1>;\n}` },
  { start: 3, end: 6, title: "Add a greeting", caption: "Let's add a greeting inside the heading.", code: `export default function App() {\n  return <h1>Hello RoadRunners!</h1>;\n}` },
  { start: 6, end: 9, title: "Focus App.tsx", caption: "Follow along in App.tsx.", code: `export default function App() {\n  return <h1>Hello RoadRunners!</h1>;\n}` },
  { start: 9, end: 12, title: "Your turn", caption: "Pause and try changing the message yourself.", code: `export default function App() {\n  return <h1>Hello RoadRunners!</h1>;\n}` },
];

function escPath(p) {
  return p.replace(/:/g, "\\:").replace(/'/g, "'\\''");
}

function writeTextFiles() {
  mkdirSync(TMP, { recursive: true });
  const filters = [];

  filters.push(
    `drawtext=fontfile=/System/Library/Fonts/Supplemental/Menlo.ttc:textfile='${escPath(join(TMP, "brand.txt"))}':fontcolor=0xd97706:fontsize=42:x=(w-text_w)/2:y=48:enable='between(t,0,${DURATION})'`
  );
  writeFileSync(join(TMP, "brand.txt"), "RoadRunners — Trial Scrim Demo");

  slides.forEach((s, i) => {
    const capFile = join(TMP, `cap-${i}.txt`);
    const titleFile = join(TMP, `title-${i}.txt`);
    const codeFile = join(TMP, `code-${i}.txt`);
    writeFileSync(capFile, s.caption);
    writeFileSync(titleFile, s.title);
    writeFileSync(codeFile, s.code);

    const en = `between(t,${s.start},${s.end})`;
    filters.push(
      `drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial Bold.ttf:textfile='${escPath(titleFile)}':fontcolor=white:fontsize=32:x=80:y=120:enable='${en}'`,
      `drawtext=fontfile=/System/Library/Fonts/Supplemental/Menlo.ttc:textfile='${escPath(codeFile)}':fontcolor=0xececec:fontsize=22:x=80:y=200:enable='${en}'`,
      `drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:textfile='${escPath(capFile)}':fontcolor=0xececec:fontsize=26:x=(w-text_w)/2:y=h-100:enable='${en}'`
    );
  });

  filters.push(
    `drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='Interactive scrim — not a recording. Try the app for the full experience.':fontcolor=0x807d72:fontsize=18:x=(w-text_w)/2:y=h-40:enable='between(t,0,${DURATION})'`
  );

  return filters.join(",");
}

if (!ffmpegPath) {
  console.error("ffmpeg-static binary not found");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const vf = writeTextFiles();

try {
  execFileSync(
    ffmpegPath,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `color=c=0x141413:s=${W}x${H}:d=${DURATION}`,
      "-vf",
      vf,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      OUT_FILE,
    ],
    { stdio: "inherit" }
  );
  console.log(`\nWrote ${OUT_FILE}`);
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

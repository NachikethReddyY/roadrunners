insert into public.skill_catalog (slug, name, category, icon) values
  ('html', 'HTML', 'web', 'globe'),
  ('css', 'CSS', 'web', 'globe'),
  ('javascript', 'JavaScript', 'web', 'globe'),
  ('react', 'React', 'web', 'globe'),
  ('typescript', 'TypeScript', 'web', 'globe'),
  ('nextjs', 'Next.js', 'web', 'globe'),
  ('swift', 'Swift', 'mobile', 'phone'),
  ('react-native', 'React Native', 'mobile', 'phone'),
  ('kotlin', 'Kotlin', 'mobile', 'phone'),
  ('sql', 'SQL', 'data', 'chart'),
  ('python-data', 'Python for Data', 'data', 'chart'),
  ('analytics', 'Analytics', 'data', 'chart'),
  ('ml-basics', 'ML Basics', 'ai', 'brain'),
  ('prompt-engineering', 'Prompt Engineering', 'ai', 'brain'),
  ('llm-apps', 'LLM Apps', 'ai', 'brain'),
  ('git', 'Git', 'devops', 'server'),
  ('docker', 'Docker', 'devops', 'server'),
  ('cicd', 'CI/CD', 'devops', 'server'),
  ('apis', 'HTTP & APIs', 'web', 'globe'),
  ('explore', 'Explore', 'explore', 'compass')
on conflict (slug) do nothing;

-- curated Scrimba-style lessons
insert into public.lesson_scrims (
  slug,
  title,
  skill_tag,
  template,
  initial_files,
  timeline,
  slides,
  duration_ms
) values
  (
    'hello-react',
    'Hello React',
    'react',
    'react-ts',
    '{"App.tsx": "export default function App() {\n  return <h1>Hello RoadRunners!</h1>;\n}\n"}'::jsonb,
    '{"durationMs":12000,"events":[{"t":0,"type":"caption","text":"Welcome to your first React scrim on RoadRunners."},{"t":0,"type":"slide","slideId":"intro"},{"t":0,"type":"files","files":{"App.tsx":"export default function App() {\n  return <h1></h1>;\n}\n"}},{"t":3000,"type":"caption","text":"Let''s add a greeting inside the heading."},{"t":3000,"type":"files","files":{"App.tsx":"export default function App() {\n  return <h1>Hello RoadRunners!</h1>;\n}\n"}},{"t":6000,"type":"focus","path":"App.tsx"},{"t":9000,"type":"caption","text":"Pause and try changing the message yourself."},{"t":12000,"type":"run"}]}'::jsonb,
    '[{"id":"intro","title":"Welcome","markdown":"React components return JSX — HTML-like syntax inside JavaScript."}]'::jsonb,
    12000
  ),
  (
    'hello-python',
    'Hello Python',
    'python-data',
    'python',
    '{"main.py": "print(''Welcome to Python on RoadRunners'')"}'::jsonb,
    '{"durationMs":8000,"events":[{"t":0,"type":"caption","text":"Welcome to Python — let''s print your first message."},{"t":0,"type":"slide","slideId":"intro"},{"t":0,"type":"files","files":{"main.py":"print('''')"}},{"t":2500,"type":"caption","text":"Inside the quotes, type your greeting."},{"t":2500,"type":"files","files":{"main.py":"print(''Welcome to Python on RoadRunners'')"}},{"t":5000,"type":"focus","path":"main.py"},{"t":6500,"type":"caption","text":"Hit Run to see output in the console below."},{"t":8000,"type":"run"}]}'::jsonb,
    '[{"id":"intro","title":"Python basics","markdown":"Use `print()` to send output to the console."}]'::jsonb,
    8000
  )
on conflict (slug) do nothing;

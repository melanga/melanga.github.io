/** The "hidden layer" of the stack network: each technology belongs to one domain. */
export interface TechDomain {
  readonly id: string;
  readonly label: string;
}

export const DOMAINS: readonly TechDomain[] = [
  { id: 'ml', label: 'ML & Data' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'web', label: 'Web & UI' },
  { id: 'backend', label: 'Backend' },
  { id: 'systems', label: 'Systems & Tools' },
];

const DOMAIN_OF: Readonly<Record<string, string>> = {
  python: 'ml',
  'jupyter notebook': 'ml',
  tensorflow: 'ml',
  'scikit-learn': 'ml',
  pytorch: 'ml',
  keras: 'ml',
  pandas: 'ml',
  numpy: 'ml',
  opencv: 'ml',
  r: 'ml',
  matlab: 'ml',
  'machine learning': 'ml',
  'deep learning': 'ml',
  'computer vision': 'ml',
  'natural language processing': 'ml',
  'neural networks': 'ml',
  'data science': 'ml',
  nlp: 'ml',
  cnn: 'ml',
  lstm: 'ml',
  ai: 'ml',
  ml: 'ml',

  dart: 'mobile',
  flutter: 'mobile',
  kotlin: 'mobile',
  swift: 'mobile',
  'objective-c': 'mobile',
  android: 'mobile',

  javascript: 'web',
  typescript: 'web',
  react: 'web',
  angular: 'web',
  vue: 'web',
  svelte: 'web',
  redux: 'web',
  html: 'web',
  css: 'web',
  scss: 'web',
  'tailwind css': 'web',
  'next.js': 'web',
  'pern stack': 'web',

  'node.js': 'backend',
  express: 'backend',
  django: 'backend',
  flask: 'backend',
  fastapi: 'backend',
  'socket.io': 'backend',
  postgresql: 'backend',
  sqlite: 'backend',
  mysql: 'backend',
  mongodb: 'backend',
  redis: 'backend',
  firebase: 'backend',
  'cloud firestore': 'backend',
  java: 'backend',
  php: 'backend',
  go: 'backend',
  'c#': 'backend',

  docker: 'systems',
  dockerfile: 'systems',
  git: 'systems',
  linux: 'systems',
  aws: 'systems',
  gcp: 'systems',
  shell: 'systems',
  makefile: 'systems',
  c: 'systems',
  'c++': 'systems',
  rust: 'systems',
};

export function domainOf(tech: string): string {
  return DOMAIN_OF[tech.toLowerCase()] ?? 'systems';
}

/** GitHub linguist-style colours for the common languages. */
export const LANG_COLORS: Readonly<Record<string, string>> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Dart: '#00b4ab',
  Java: '#b07219',
  Kotlin: '#a97bff',
  HTML: '#e34c26',
  CSS: '#663399',
  SCSS: '#c6538c',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00add8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Shell: '#89e051',
  'Jupyter Notebook': '#da5b0b',
  Dockerfile: '#384d54',
};

export function langColor(lang: string | null | undefined): string {
  return (lang && LANG_COLORS[lang]) || '#8b8a85';
}

export interface ProjectOverride {
  readonly displayName?: string;
  readonly descriptionOverride?: string;
  readonly extraTechnologies?: readonly string[];
  readonly featured?: boolean;
  readonly hidden?: boolean;
  readonly sortWeight?: number;
  /** Screenshot used for featured projects. */
  readonly image?: string;
}

export const PROJECT_OVERRIDES: Readonly<Record<string, ProjectOverride>> = {
  'university-timetable-companion-app': {
    displayName: 'Uni Timetable Companion',
    extraTechnologies: ['Flutter', 'Firebase', 'Cloud Firestore'],
    featured: true,
    sortWeight: 10,
    image: 'assets/images/time_table_project.webp',
  },
  'event-portal': {
    displayName: 'Event Portal',
    extraTechnologies: ['PostgreSQL', 'Express', 'React', 'Node.js', 'Redux', 'Socket.io'],
    featured: true,
    sortWeight: 9,
    image: 'assets/images/event_portal_project.webp',
  },
  GroupMeetPlanner: {
    displayName: 'Group Meet Planner',
    extraTechnologies: ['Django', 'SQLite', 'Docker'],
    featured: true,
    sortWeight: 8,
    image: 'assets/images/group_meet_planner_project.webp',
  },
  'melanga.github.io': {
    hidden: true,
  },
  melanga: {
    hidden: true,
  },
};

export const TECH_ALIASES: Readonly<Record<string, string>> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  py: 'Python',
  dart: 'Dart',
  tailwindcss: 'Tailwind CSS',
  tensorflow: 'TensorFlow',
  'scikit-learn': 'Scikit-learn',
  sklearn: 'Scikit-learn',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  postgresql: 'PostgreSQL',
  postgres: 'PostgreSQL',
  socketio: 'Socket.io',
  'socket.io': 'Socket.io',
  firebase: 'Firebase',
  flutter: 'Flutter',
  django: 'Django',
  docker: 'Docker',
  react: 'React',
  redux: 'Redux',
  angular: 'Angular',
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  css: 'CSS',
  html: 'HTML',
  html5: 'HTML',
  dockerfile: 'Docker',
  'jupyter-notebook': 'Jupyter Notebook',
  'pern-stack': 'PERN Stack',
  'socket-io': 'Socket.io',
  'tailwind-css': 'Tailwind CSS',
  nextjs: 'Next.js',
  pytorch: 'PyTorch',
  opencv: 'OpenCV',
  keras: 'Keras',
  kotlin: 'Kotlin',
  java: 'Java',
};

export const NOISY_TOPICS = new Set([
  'portfolio',
  'demo',
  'test',
  'assignment',
  'learning',
  'practice',
  'tutorial',
  'example',
  'experiment',
]);

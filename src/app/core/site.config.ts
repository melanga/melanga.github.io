/** Personal details in one place — edit here, the whole site follows. */
export const SITE = {
  name: 'Melanga Dissanayake',
  firstName: 'Melanga',
  lastName: 'Dissanayake',
  email: 'dissanayakedmmb@gmail.com',
  github: 'https://github.com/melanga',
  githubHandle: 'melanga',
  location: 'Sri Lanka',
  timeZone: 'Asia/Colombo',
  utcOffset: 'UTC+05:30',
  degree: 'B.Sc. (Hons) Industrial Information Technology',
  roles: ['Software Engineer', 'ML & Neural Networks', 'Mobile & Web Developer', 'Problem Solver'],
} as const;

export interface NavSection {
  readonly id: string;
  readonly index: string;
  readonly label: string;
  readonly layer: string;
}

/** Page sections, framed as the layers of a network. */
export const SECTIONS: readonly NavSection[] = [
  { id: 'about', index: '01', label: 'About', layer: 'Input' },
  { id: 'stack', index: '02', label: 'Stack', layer: 'Hidden layers' },
  { id: 'work', index: '03', label: 'Work', layer: 'Output' },
  { id: 'contact', index: '04', label: 'Contact', layer: 'Inference' },
];

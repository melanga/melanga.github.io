import { normalizeTechName, filterNoisyTopics } from './technology-normalizer';
import { domainOf } from './tech-domains';

describe('normalizeTechName', () => {
  it('maps known aliases to their canonical names', () => {
    expect(normalizeTechName('nodejs')).toBe('Node.js');
    expect(normalizeTechName('Dockerfile')).toBe('Docker');
    expect(normalizeTechName(' postgres ')).toBe('PostgreSQL');
  });

  it('turns lowercase GitHub topic slugs into readable names', () => {
    expect(normalizeTechName('computer-vision')).toBe('Computer Vision');
    expect(normalizeTechName('nlp')).toBe('NLP');
    expect(normalizeTechName('deep-learning')).toBe('Deep Learning');
  });

  it('leaves properly cased language names untouched', () => {
    expect(normalizeTechName('Jupyter Notebook')).toBe('Jupyter Notebook');
    expect(normalizeTechName('C++')).toBe('C++');
  });

  it('drops noisy topics', () => {
    expect(filterNoisyTopics(['portfolio', 'flutter', 'tutorial'])).toEqual(['Flutter']);
  });
});

describe('domainOf', () => {
  it('places technologies in the hidden layer of the stack network', () => {
    expect(domainOf('Python')).toBe('ml');
    expect(domainOf(normalizeTechName('computer-vision'))).toBe('ml');
    expect(domainOf('Flutter')).toBe('mobile');
    expect(domainOf('React')).toBe('web');
    expect(domainOf('PostgreSQL')).toBe('backend');
  });

  it('falls back to systems & tools for anything unknown', () => {
    expect(domainOf('Brainfuck')).toBe('systems');
  });
});

export interface ExperimentData {
  id: string;
  name: string;
  caption: string;
  url: string;
  image_path: string;
}

import thebuttonThumbnail from '@/assets/thumbnails/thebutton.png';

export const EXPERIMENTS_LIST: ExperimentData[] = [
  {
    id: 'thebutton',
    name: 'The Button',
    caption: 'Have you pressed the button?',
    url: 'https://thebutton.lostpixels.org',
    image_path: thebuttonThumbnail,
  },
];

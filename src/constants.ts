export interface ExperimentData {
  id: string;
  name: string;
  caption: string;
  url: string;
  image_path: string;
}

import thebuttonThumbnail from "@/assets/thumbnails/thebutton.png";
import mastermindThumbnail from "@/assets/thumbnails/mastermind.png";
import goaltreeThumbnail from "@/assets/thumbnails/placeholder.png";

export const EXPERIMENTS_LIST: ExperimentData[] = [
  {
    id: "thebutton",
    name: "The Button",
    caption: "Have you pressed the button?",
    url: "https://thebutton.lostpixels.org",
    image_path: thebuttonThumbnail,
  },
  {
    id: "mastermind",
    name: "Mastermind",
    caption: "Programming tool for Brainf***.",
    url: "https://mastermind.lostpixels.org",
    image_path: mastermindThumbnail,
  },
  // {
  //   id: "goaltree",
  //   name: "Goal Tree",
  //   caption: "Tool for managing multiple concurrent interests.",
  //   url: "https://goaltree.lostpixels.org",
  //   image_path: goaltreeThumbnail,
  // },
];

export const en: Dict = {
  metadata: {
    title: "imdbGame",
    description: "Guess the movie from its plot",
  },
  header: {
    home: "Home",
    play: "Play",
    hallOfFame: "Hall of Fame",
    about: "About",
    logoAriaLabel: "IMDb game",
    openMenu: "Open menu",
    switchToFrench: "FR",
    switchToEnglish: "EN",
    switchConfirmMidGame: "Switch language? Your current game will be lost.",
  },
  home: {
    tagline: "Read the plot, guess the movie!",
    play: "Play",
  },
  round: {
    failedToLoad: "Failed to load",
    worth: "Round worth",
    points: "pts",
    next: "Next",
    hint: {
      year: "Year",
      director: "Director",
      leadActor: "Lead actor",
    },
  },
  summary: {
    score: "Score:",
    qualified: "Nice — your score made the Hall of Fame!",
    yourName: "Your name",
    save: "Save my score",
    saved: "Score saved.",
    viewHallOfFame: "View Hall of Fame",
    playAgain: "Play again",
    errors: {
      invalidName: "Invalid name (1 to 40 characters).",
      notQualified: "This score no longer qualifies for the Hall of Fame.",
      alreadySubmitted: "Score already saved.",
      sessionNotFound: "Session not found.",
    },
  },
  about: {
    heading: "About",
    body: "The IMDb movie quiz - read the plot, guess the movie!",
    dataAttribution: "Data comes from",
  },
  hallOfFame: {
    heading: "Hall of Fame",
    weekly: "This week",
    monthly: "This month",
    allTime: "All time",
    empty: "No scores yet.",
  },
};

export type Dict = {
  metadata: { title: string; description: string };
  header: {
    home: string;
    play: string;
    hallOfFame: string;
    about: string;
    logoAriaLabel: string;
    openMenu: string;
    switchToFrench: string;
    switchToEnglish: string;
    switchConfirmMidGame: string;
  };
  home: { tagline: string; play: string };
  round: {
    failedToLoad: string;
    worth: string;
    points: string;
    next: string;
    hint: { year: string; director: string; leadActor: string };
  };
  summary: {
    score: string;
    qualified: string;
    yourName: string;
    save: string;
    saved: string;
    viewHallOfFame: string;
    playAgain: string;
    errors: {
      invalidName: string;
      notQualified: string;
      alreadySubmitted: string;
      sessionNotFound: string;
    };
  };
  about: { heading: string; body: string; dataAttribution: string };
  hallOfFame: {
    heading: string;
    weekly: string;
    monthly: string;
    allTime: string;
    empty: string;
  };
};

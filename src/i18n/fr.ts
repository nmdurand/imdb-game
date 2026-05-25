import type { Dict } from "./en";

export const fr: Dict = {
  metadata: {
    title: "imdbGame",
    description: "Devine le film à partir de son synopsis",
  },
  header: {
    home: "Accueil",
    play: "Jouer",
    hallOfFame: "Hall of Fame",
    about: "À propos",
    logoAriaLabel: "IMDb game",
    openMenu: "Ouvrir le menu",
    switchToFrench: "FR",
    switchToEnglish: "EN",
    switchConfirmMidGame: "Changer de langue ? Ta partie en cours sera perdue.",
  },
  home: {
    tagline: "Lis le synopsis, devine le film !",
    play: "Jouer",
  },
  round: {
    failedToLoad: "Échec du chargement",
    worth: "Manche à",
    points: "pts",
    next: "Suivant",
    hint: {
      year: "Année",
      director: "Réalisateur",
      leadActor: "Acteur principal",
    },
  },
  summary: {
    score: "Score :",
    qualified: "Bravo — ton score entre au Hall of Fame !",
    yourName: "Ton nom",
    save: "Enregistrer mon score",
    saved: "Score enregistré.",
    viewHallOfFame: "Voir le Hall of Fame",
    playAgain: "Rejouer",
    errors: {
      invalidName: "Nom invalide (1 à 40 caractères).",
      notQualified: "Ce score ne qualifie plus pour le Hall of Fame.",
      alreadySubmitted: "Score déjà enregistré.",
      sessionNotFound: "Partie introuvable.",
    },
  },
  about: {
    heading: "À propos",
    body: "Le quiz cinéma IMDb — lis le synopsis, devine le film !",
    dataAttribution: "Les données viennent de",
  },
  hallOfFame: {
    heading: "Hall of Fame",
    weekly: "Cette semaine",
    monthly: "Ce mois-ci",
    allTime: "Tous les temps",
    empty: "Aucun score pour le moment.",
  },
};

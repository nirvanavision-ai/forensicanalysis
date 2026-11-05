/**
 * Bibliography used by the Knowledge Base.
 *
 * `inSuppliedKB` marks works named in the project's supplied knowledge base
 * ("Knowledge Base 1.pdf"). `checked` means the bibliographic details were confirmed during
 * this build: either against a publisher or journal page while the app was written, or by the
 * research pass of 2026-11-05 against Crossref or the publisher's page (see `checkLevel`).
 * Entries the research pass could only match in an index keep `checked: false`.
 * No flag means the full work was re-read, and no entry is evidence about the people in any
 * transcript.
 */
import { mergeResearchSources } from './research';

export interface Source {
  id: string;
  citation: string;
  inSuppliedKB: boolean;
  checked: boolean;
  url?: string;
  note?: string;
  /** Fields below come from the research pass (scripts/import-research.mjs). */
  doi?: string;
  studyType?: string;
  /** What the work found, in plain language. */
  claim?: string;
  /** What it cannot establish about anyone in a transcript. */
  cannotEstablish?: string;
  limitations?: string;
  contestedNote?: string;
  /** How the citation was checked: crossref, publisher-page, index-match, secondary-report. */
  checkLevel?: string;
  checkNote?: string;
  research?: boolean;
}

const BASE_SOURCES: Source[] = [
  // Judgment and bias
  { id: 'kahneman2011', citation: 'Kahneman, D. (2011). Thinking, fast and slow. Farrar, Straus and Giroux.', inSuppliedKB: true, checked: false },
  { id: 'kt1979', citation: 'Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263–291.', inSuppliedKB: true, checked: false },
  { id: 'tk1981', citation: 'Tversky, A., & Kahneman, D. (1981). The framing of decisions and the psychology of choice. Science, 211(4481), 453–458.', inSuppliedKB: true, checked: false },
  { id: 'nickerson1998', citation: 'Nickerson, R. S. (1998). Confirmation bias: A ubiquitous phenomenon in many guises. Review of General Psychology, 2(2), 175–220.', inSuppliedKB: false, checked: false },
  { id: 'ross1977', citation: 'Ross, L. (1977). The intuitive psychologist and his shortcomings: Distortions in the attribution process. In L. Berkowitz (Ed.), Advances in experimental social psychology (Vol. 10, pp. 173–220). Academic Press.', inSuppliedKB: false, checked: false },
  { id: 'haidt2001', citation: 'Haidt, J. (2001). The emotional dog and its rational tail: A social intuitionist approach to moral judgment. Psychological Review, 108(4), 814–834.', inSuppliedKB: false, checked: false },
  { id: 'haidt2012', citation: 'Haidt, J. (2012). The righteous mind: Why good people are divided by politics and religion. Pantheon Books.', inSuppliedKB: true, checked: false },
  { id: 'festinger1957', citation: 'Festinger, L. (1957). A theory of cognitive dissonance. Stanford University Press.', inSuppliedKB: true, checked: false },

  // Influence and compliance
  { id: 'cialdini2021', citation: 'Cialdini, R. B. (2021). Influence, new and expanded: The psychology of persuasion. Harper Business.', inSuppliedKB: true, checked: false, note: 'The expanded edition adds “unity” as a seventh principle.' },
  { id: 'freedman1966', citation: 'Freedman, J. L., & Fraser, S. C. (1966). Compliance without pressure: The foot-in-the-door technique. Journal of Personality and Social Psychology, 4(2), 195–202.', inSuppliedKB: false, checked: false },
  { id: 'cialdini1975', citation: 'Cialdini, R. B., Vincent, J. E., Lewis, S. K., Catalan, J., Wheeler, D., & Darby, B. L. (1975). Reciprocal concessions procedure for inducing compliance: The door-in-the-face technique. Journal of Personality and Social Psychology, 31(2), 206–215.', inSuppliedKB: false, checked: false },
  { id: 'cialdini1978', citation: 'Cialdini, R. B., Cacioppo, J. T., Bassett, R., & Miller, J. A. (1978). Low-ball procedure for producing compliance: Commitment then cost. Journal of Personality and Social Psychology, 36(5), 463–476.', inSuppliedKB: false, checked: false },

  // Moral disengagement
  { id: 'bandura1996', citation: 'Bandura, A., Barbaranelli, C., Caprara, G. V., & Pastorelli, C. (1996). Mechanisms of moral disengagement in the exercise of moral agency. Journal of Personality and Social Psychology, 71(2), 364–374.', inSuppliedKB: false, checked: false },
  { id: 'bandura1999', citation: 'Bandura, A. (1999). Moral disengagement in the perpetration of inhumanities. Personality and Social Psychology Review, 3(3), 193–209.', inSuppliedKB: false, checked: false },
  { id: 'bandura2016', citation: 'Bandura, A. (2016). Moral disengagement: How people do harm and live with themselves. Worth Publishers.', inSuppliedKB: false, checked: false },

  // Relational systems
  { id: 'bowen1978', citation: 'Bowen, M. (1978). Family therapy in clinical practice. Jason Aronson.', inSuppliedKB: false, checked: false },
  { id: 'kerrbowen1988', citation: 'Kerr, M. E., & Bowen, M. (1988). Family evaluation: An approach based on Bowen theory. W. W. Norton.', inSuppliedKB: false, checked: false },
  { id: 'karpman1968', citation: 'Karpman, S. B. (1968). Fairy tales and script drama analysis. Transactional Analysis Bulletin, 7(26), 39–43.', inSuppliedKB: false, checked: true },
  { id: 'caplow1956', citation: 'Caplow, T. (1956). A theory of coalitions in the triad. American Sociological Review, 21(4), 489–493.', inSuppliedKB: false, checked: true },
  { id: 'simmel1950', citation: 'Simmel, G. (1950). The sociology of Georg Simmel (K. H. Wolff, Ed. & Trans.). Free Press.', inSuppliedKB: false, checked: false },
  { id: 'conley2013', citation: 'Conley, T. D., Moors, A. C., Matsick, J. L., & Ziegler, A. (2013). The fewer the merrier?: Assessing stigma surrounding consensually non-monogamous romantic relationships. Analyses of Social Issues and Public Policy, 13(1), 1–30.', inSuppliedKB: false, checked: true },
  { id: 'conley2017', citation: 'Conley, T. D., Matsick, J. L., Moors, A. C., & Ziegler, A. (2017). Investigation of consensually nonmonogamous relationships: Theories, methods, and new directions. Perspectives on Psychological Science, 12(2), 205–232.', inSuppliedKB: false, checked: true },

  // Betrayal, disclosure, defensive responses
  { id: 'freyd1996', citation: 'Freyd, J. J. (1996). Betrayal trauma: The logic of forgetting childhood abuse. Harvard University Press.', inSuppliedKB: false, checked: false },
  { id: 'freyd1997', citation: 'Freyd, J. J. (1997). Violations of power, adaptive blindness, and betrayal trauma theory. Feminism & Psychology, 7(1), 22–32.', inSuppliedKB: false, checked: true },
  { id: 'harsey2017', citation: 'Harsey, S. J., Zurbriggen, E. L., & Freyd, J. J. (2017). Perpetrator responses to victim confrontation: DARVO and victim self-blame. Journal of Aggression, Maltreatment & Trauma, 26(6), 644–663.', inSuppliedKB: false, checked: true },
  { id: 'harsey2020', citation: 'Harsey, S., & Freyd, J. J. (2020). Deny, attack, and reverse victim and offender (DARVO): What is the influence on perceived perpetrator and victim credibility? Journal of Aggression, Maltreatment & Trauma, 29(8), 897–916.', inSuppliedKB: false, checked: true },
  { id: 'smithfreyd2014', citation: 'Smith, C. P., & Freyd, J. J. (2014). Institutional betrayal. American Psychologist, 69(6), 575–587.', inSuppliedKB: false, checked: true },
  { id: 'ullman2010', citation: 'Ullman, S. E. (2010). Talking about sexual assault: Society’s response to survivors. American Psychological Association.', inSuppliedKB: false, checked: true },
  { id: 'sweet2019', citation: 'Sweet, P. L. (2019). The sociology of gaslighting. American Sociological Review, 84(5), 851–875.', inSuppliedKB: false, checked: true },

  // Consent, stress, protective responses
  { id: 'muehlenhard2016', citation: 'Muehlenhard, C. L., Humphreys, T. P., Jozkowski, K. N., & Peterson, Z. D. (2016). The complexities of sexual consent among college students: A conceptual and empirical review. The Journal of Sex Research, 53(4–5), 457–487.', inSuppliedKB: false, checked: true },
  { id: 'walker2013', citation: 'Walker, P. (2013). Complex PTSD: From surviving to thriving. Azure Coyote.', inSuppliedKB: false, checked: false },
  { id: 'porges2011', citation: 'Porges, S. W. (2011). The polyvagal theory: Neurophysiological foundations of emotions, attachment, communication, and self-regulation. W. W. Norton.', inSuppliedKB: false, checked: false },
  { id: 'grossman2023', citation: 'Grossman, P. (2023). Fundamental challenges and likely refutations of the five basic premises of the polyvagal theory. Biological Psychology, 180, 108589.', inSuppliedKB: false, checked: true },

  // Argument, logic, rhetoric
  { id: 'toulmin1958', citation: 'Toulmin, S. E. (1958). The uses of argument. Cambridge University Press.', inSuppliedKB: true, checked: false },
  { id: 'copi2014', citation: 'Copi, I. M., Cohen, C., & McMahon, K. (2014). Introduction to logic (14th ed.). Pearson.', inSuppliedKB: true, checked: false },
  { id: 'aristotle_organon', citation: 'Aristotle. Organon (Categories, On Interpretation, Prior and Posterior Analytics, Topics, Sophistical Refutations). Various translations.', inSuppliedKB: true, checked: false },
  { id: 'aristotle_rhetoric', citation: 'Aristotle. Rhetoric. Various translations.', inSuppliedKB: true, checked: false },
  { id: 'priest2017', citation: 'Priest, G. (2017). Logic: A very short introduction (2nd ed.). Oxford University Press.', inSuppliedKB: true, checked: false, note: 'The supplied knowledge base names Priest’s “logic and philosophy works” without a title; this introductory volume is used here.' },
  { id: 'dennett2013', citation: 'Dennett, D. C. (2013). Intuition pumps and other tools for thinking. W. W. Norton.', inSuppliedKB: true, checked: false },
  { id: 'perelman1969', citation: 'Perelman, Ch., & Olbrechts-Tyteca, L. (1969). The new rhetoric: A treatise on argumentation (J. Wilkinson & P. Weaver, Trans.). University of Notre Dame Press. (Original work published 1958)', inSuppliedKB: true, checked: false },
  { id: 'walton2008', citation: 'Walton, D. (2008). Informal logic: A pragmatic approach (2nd ed.). Cambridge University Press.', inSuppliedKB: true, checked: false },
  { id: 'waltonkrabbe1995', citation: 'Walton, D. N., & Krabbe, E. C. W. (1995). Commitment in dialogue: Basic concepts of interpersonal reasoning. State University of New York Press.', inSuppliedKB: false, checked: true },
  { id: 'waltonschemes2008', citation: 'Walton, D., Reed, C., & Macagno, F. (2008). Argumentation schemes. Cambridge University Press.', inSuppliedKB: false, checked: false },

  // Behavioural economics
  { id: 'thaler2008', citation: 'Thaler, R. H., & Sunstein, C. R. (2008). Nudge: Improving decisions about health, wealth, and happiness. Yale University Press.', inSuppliedKB: true, checked: false },
  { id: 'ariely2008', citation: 'Ariely, D. (2008). Predictably irrational: The hidden forces that shape our decisions. HarperCollins.', inSuppliedKB: true, checked: false, note: 'A 2012 PNAS study Ariely co-authored was retracted in 2021 after problems were found in its data. Treat individual findings in popular behavioural-economics books as claims to verify, not settled results.' },

  // Communication
  { id: 'rosenberg2015', citation: 'Rosenberg, M. B. (2015). Nonviolent communication: A language of life (3rd ed.). PuddleDancer Press.', inSuppliedKB: true, checked: false },
  { id: 'tannen1986', citation: 'Tannen, D. (1986). That’s not what I meant! How conversational style makes or breaks relationships. William Morrow.', inSuppliedKB: true, checked: false },
  { id: 'tannen2005', citation: 'Tannen, D. (2005). Conversational style: Analyzing talk among friends (New ed.). Oxford University Press. (Original work published 1984)', inSuppliedKB: true, checked: false },
  { id: 'schegloff1977', citation: 'Schegloff, E. A., Jefferson, G., & Sacks, H. (1977). The preference for self-correction in the organization of repair in conversation. Language, 53(2), 361–382.', inSuppliedKB: false, checked: false },
  { id: 'gottman1994', citation: 'Gottman, J. M. (1994). What predicts divorce? The relationship between marital processes and marital outcomes. Lawrence Erlbaum.', inSuppliedKB: false, checked: false },
  { id: 'gottman1999', citation: 'Gottman, J. M., & Silver, N. (1999). The seven principles for making marriage work. Crown.', inSuppliedKB: false, checked: false },

  // Negotiation
  { id: 'fisher2011', citation: 'Fisher, R., Ury, W., & Patton, B. (2011). Getting to yes: Negotiating agreement without giving in (3rd ed.). Penguin. (Original work published 1981)', inSuppliedKB: true, checked: false },
  { id: 'voss2016', citation: 'Voss, C., & Raz, T. (2016). Never split the difference: Negotiating as if your life depended on it. Harper Business.', inSuppliedKB: true, checked: false },
  { id: 'malhotra2007', citation: 'Malhotra, D., & Bazerman, M. H. (2007). Negotiation genius. Bantam.', inSuppliedKB: true, checked: false, note: 'The supplied knowledge base names “Harvard negotiation frameworks” by Malhotra; this book is the representative work used here.' },
  { id: 'schelling1960', citation: 'Schelling, T. C. (1960). The strategy of conflict. Harvard University Press.', inSuppliedKB: true, checked: false },

  // Institutional reference sources named in the supplied knowledge base
  { id: 'sep_fallacies', citation: 'Hansen, H. Fallacies. In Stanford Encyclopedia of Philosophy.', inSuppliedKB: true, checked: false, url: 'https://plato.stanford.edu/entries/fallacies/' },
  { id: 'sep_informal_logic', citation: 'Groarke, L. Informal logic. In Stanford Encyclopedia of Philosophy.', inSuppliedKB: true, checked: false, url: 'https://plato.stanford.edu/entries/logic-informal/' },
  { id: 'sep_aristotle_rhetoric', citation: 'Rapp, C. Aristotle’s rhetoric. In Stanford Encyclopedia of Philosophy.', inSuppliedKB: true, checked: false, url: 'https://plato.stanford.edu/entries/aristotle-rhetoric/' },
  { id: 'pon', citation: 'Program on Negotiation at Harvard Law School. Negotiation resources and teaching materials.', inSuppliedKB: true, checked: false, url: 'https://www.pon.harvard.edu/' },
  { id: 'purdue_owl', citation: 'Purdue Online Writing Lab. Logical fallacies.', inSuppliedKB: true, checked: false, url: 'https://owl.purdue.edu/' },
  { id: 'apa_dictionary', citation: 'American Psychological Association. APA Dictionary of Psychology.', inSuppliedKB: true, checked: false, url: 'https://dictionary.apa.org/' },
];

export const SOURCES: Source[] = mergeResearchSources(BASE_SOURCES);

export const SOURCE_BY_ID: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

/** Reference sources named in the supplied knowledge base but not tied to a specific concept card. */
export const SUPPLIED_KB_GENERAL_SOURCES = [
  'Stanford Encyclopedia of Philosophy',
  'Harvard Program on Negotiation',
  'MIT OpenCourseWare',
  'Yale Open Courses',
  'Coursera and edX courses from universities',
  'Purdue OWL',
  'Lumen Learning',
  'Oxford Reference',
  'American Psychological Association',
  'Google Scholar',
  'Journal of Economic Perspectives; American Economic Review',
  'FBI negotiation case studies (public summaries)',
  'Political debate transcripts (for fallacy examples)',
  'Legal reasoning archives and court opinions',
  'BBC Future',
  'News Literacy Project',
];

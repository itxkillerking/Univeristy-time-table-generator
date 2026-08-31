export interface CourseCatalogueEntry {
  semester: string;
  courseName: string;
  shortName: string;
  aliases: string[];
  isElective: boolean;
  electiveGroup?: string;
  sourceName?: string;
}

export const courseCatalogue: CourseCatalogueEntry[] = [
  // SEMESTER 1
  { semester: "1st Semester", courseName: "Applications of Information & Communication Technologies", shortName: "AICT", aliases: ["AICT"], isElective: false },
  { semester: "1st Semester", courseName: "Discrete Structures", shortName: "Discrete", aliases: ["Discrete"], isElective: false },
  { semester: "1st Semester", courseName: "Islamic Studies", shortName: "Islamic Studies", aliases: [], isElective: false },
  { semester: "1st Semester", courseName: "Functional English", shortName: "Functional English", aliases: [], isElective: false },
  { semester: "1st Semester", courseName: "Applied Physics", shortName: "Applied Physics", aliases: ["Applied Phy.", "Phy"], isElective: false },
  { semester: "1st Semester", courseName: "Ideology and Constitution of Pakistan", shortName: "Ideology and Constitution of Pakistan", aliases: [], isElective: false },
  { semester: "1st Semester", courseName: "Pre-Calculus I", shortName: "Pre-Calculus I", aliases: ["Pre Cal-1"], isElective: false },

  // SEMESTER 2
  { semester: "2nd Semester", courseName: "Digital Logic Design", shortName: "DLD", aliases: ["DLD"], isElective: false },
  { semester: "2nd Semester", courseName: "Programming Fundamentals", shortName: "PF", aliases: ["PF"], isElective: false },
  { semester: "2nd Semester", courseName: "Expository Writing", shortName: "E.Writing", aliases: ["E.Writing"], isElective: false },
  { semester: "2nd Semester", courseName: "Probability & Statistics", shortName: "Prob. Stat", aliases: ["Prob. Stat"], isElective: false },
  { semester: "2nd Semester", courseName: "Professional Practices", shortName: "PP", aliases: ["PP"], isElective: false },
  { semester: "2nd Semester", courseName: "Civics and Community Engagement", shortName: "Civics & CE", aliases: ["Civics & CE"], isElective: false },
  { semester: "2nd Semester", courseName: "Pre-Calculus II", shortName: "Pre-Calculus II", aliases: ["Pre Cal-2"], isElective: false },
  { semester: "2nd Semester", courseName: "Understanding of Holy Quran-1", shortName: "Quran-1", aliases: ["Quran-1"], isElective: false },

  // SEMESTER 3
  { semester: "3rd Semester", courseName: "Object Oriented Programming", shortName: "OOP", aliases: ["OOP"], isElective: false },
  { semester: "3rd Semester", courseName: "Computer Organization and Assembly Language", shortName: "COAL", aliases: ["COAL"], isElective: false },
  { semester: "3rd Semester", courseName: "Computer Networks", sourceName: "Compiuter Networks", shortName: "CN", aliases: ["CN", "C.Network", "C.Networks"], isElective: false },
  { semester: "3rd Semester", courseName: "Software Engineering", shortName: "SE", aliases: ["SE"], isElective: false },
  { semester: "3rd Semester", courseName: "Calculus and Analytical Geometry", shortName: "Calculus", aliases: ["Calculus"], isElective: false },

  // SEMESTER 4
  { semester: "4th Semester", courseName: "Data Structures", shortName: "DS", aliases: ["DS"], isElective: false },
  { semester: "4th Semester", courseName: "Database Systems", shortName: "DB", aliases: ["DB"], isElective: false },
  { semester: "4th Semester", courseName: "Information Security", shortName: "IS", aliases: ["IS"], isElective: false },
  { semester: "4th Semester", courseName: "Linear Algebra", shortName: "Linear", aliases: ["Linear"], isElective: false },
  { semester: "4th Semester", courseName: "Entrepreneurship", shortName: "Entrepreneurship", aliases: ["ENT"], isElective: false },
  { semester: "4th Semester", courseName: "Introduction to Management", shortName: "Mngmnt", aliases: ["Mngmnt", "Mnagement"], isElective: true, electiveGroup: "Mngmnt-HRM" },
  { semester: "4th Semester", courseName: "Human Resource Management", shortName: "HRM", aliases: ["HRM"], isElective: true, electiveGroup: "Mngmnt-HRM" },
  { semester: "4th Semester", courseName: "Understanding of Holy Quran-2", shortName: "Quran-2", aliases: ["Quran-2"], isElective: false },

  // SEMESTER 5
  { semester: "5th Semester", courseName: "Artificial Intelligence", shortName: "AI", aliases: ["AI"], isElective: false },
  { semester: "5th Semester", courseName: "Advanced Database Management Systems", shortName: "Adv. DBMS", aliases: ["Adv. DBMS", "ADBMS"], isElective: false },
  { semester: "5th Semester", courseName: "Operating Systems", shortName: "OS", aliases: ["OS"], isElective: false },
  { semester: "5th Semester", courseName: "Theory of Automata", shortName: "ToA", aliases: ["ToA"], isElective: false },
  { semester: "5th Semester", courseName: "Analysis of Algorithm", shortName: "AA", aliases: ["AA"], isElective: false },
  { semester: "5th Semester", courseName: "Web Engineering", shortName: "Web", aliases: ["Web"], isElective: false },

  // SEMESTER 6
  { semester: "6th Semester", courseName: "Operating Systems", shortName: "OS", aliases: ["OS"], isElective: false },
  { semester: "6th Semester", courseName: "Computer Networks", shortName: "CN", aliases: ["C.Network", "C.Networks", "CN"], isElective: false },
  { semester: "6th Semester", courseName: "Software Project Management", shortName: "SPM", aliases: ["SPM"], isElective: false },
  { semester: "6th Semester", courseName: "Advance Software Engineering", shortName: "Adv. SE", aliases: ["Adv. SE", "Adv.SE"], isElective: false },
  { semester: "6th Semester", courseName: "Technical and Business Writing", shortName: "T&BW", aliases: ["T&BW"], isElective: false },

  // SEMESTER 7
  { semester: "7th Semester", courseName: "Artificial Intelligence", shortName: "AI", aliases: ["AI"], isElective: false },
  { semester: "7th Semester", courseName: "Intro to Machine Learning", shortName: "ML", aliases: ["ML"], isElective: true, electiveGroup: "ML-MAD" },
  { semester: "7th Semester", courseName: "Mobile Application Development", shortName: "MAD", aliases: ["MAD"], isElective: true, electiveGroup: "ML-MAD" },
  { semester: "7th Semester", courseName: "Parallel and Distributed Computing", shortName: "PDC", aliases: ["PDC"], isElective: false },
  { semester: "7th Semester", courseName: "Entrepreneurship", shortName: "Entrepreneurship", aliases: ["ENT"], isElective: false },
  { semester: "7th Semester", courseName: "Career Development Course", shortName: "CDC", aliases: ["CDC"], isElective: false },
  { semester: "7th Semester", courseName: "Final Year Project-I", shortName: "Final Year Project-I", aliases: [], isElective: false },

  // SEMESTER 8
  { semester: "8th Semester", courseName: "Information Security", shortName: "IS", aliases: ["IS"], isElective: false },
  { semester: "8th Semester", courseName: "Distributed database Systems", shortName: "DDBS", aliases: ["DDBS"], isElective: true, electiveGroup: "DDBS-ANN" },
  { semester: "8th Semester", courseName: "Artificial Neural Networks", shortName: "ANN", aliases: ["ANN"], isElective: true, electiveGroup: "DDBS-ANN" },
  { semester: "8th Semester", courseName: "Software Testing and Implementation", shortName: "S.Testing", aliases: ["S.Testing"], isElective: false },
  { semester: "8th Semester", courseName: "Organization Behavior & Culture", shortName: "OB", aliases: ["OB"], isElective: false },
  { semester: "8th Semester", courseName: "Final Year Project-II", shortName: "Final Year Project-II", aliases: [], isElective: false }
];

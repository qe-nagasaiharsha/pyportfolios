%% pyportfolios-note.cls — PyPortfolios institutional research note
%%
%% Replicates the house style measured from Louis's reference note. Every
%% dimension and colour here traces to a measurement recorded in DESIGN-SPEC.md;
%% change the spec first, then this file.
%%
%% Engine: LuaLaTeX (needs fontspec for TeX Gyre Heros / DejaVu Sans Mono).

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{pyportfolios-note}[2026/09/05 v0.1 PyPortfolios research note]

\LoadClass[10pt]{article}

\RequirePackage{geometry}
\RequirePackage{xcolor}
\RequirePackage{fontspec}
\RequirePackage{multicol}
\RequirePackage{graphicx}
\RequirePackage{fancyhdr}
\RequirePackage{array}
\RequirePackage{booktabs}
\RequirePackage{colortbl}
\RequirePackage{fancyvrb}
\RequirePackage{ragged2e}
% Font expansion scales glyph instances, which makes measured span sizes drift
% off the exact scale (9.5 -> 9.52/9.59). Protrusion is safe; expansion is not.
\RequirePackage[expansion=false]{microtype}

% ---------------------------------------------------------------- page --------
% Letter 612x792bp, symmetric 39.6bp side margins, 532.8bp measure.
% Body starts at y=48.1 (matches the section head on continuation pages);
% the running footer sits on the navy tab at y=753.4.
\geometry{
  paperwidth   = 612bp,
  paperheight  = 792bp,
  left         = 39.6bp,
  right        = 39.6bp,
  top          = 48.1bp,
  bottom       = 52bp,
  headheight   = 0bp,
  headsep      = 0bp,
  footskip     = 25.5bp,
}
% Reference columns run 39.6-295.0 and 317.0-572.4: 255.4bp each, 22bp gutter.
\setlength{\columnsep}{22bp}

% --------------------------------------------------------------- colour -------
\definecolor{pqnavy}{HTML}{1A2C5B}        % title, heads, rules, footer tab
\definecolor{pqink}{HTML}{1A1A1A}         % body
\definecolor{pqinksec}{HTML}{4A4A4A}      % disclosures
\definecolor{pqmuted}{HTML}{6B6B6B}       % eyebrow, captions, sources
\definecolor{pqcream}{HTML}{F2F0EB}       % BOTTOM LINE panel, table header
\definecolor{pqcreamlight}{HTML}{F8F7F3}  % zebra rows, code ground
\definecolor{pqrule}{HTML}{E5E5E5}        % hairline 0.75bp
\definecolor{pqrulestrong}{HTML}{E0E0E0}  % divider 0.8bp

% ----------------------------------------------------------------- type -------
% Looked up by file name, not family name — family lookup resolves through
% luaotfload's index and is not dependable across TeX installs.
\setmainfont{texgyreheros}[
  Extension      = .otf,
  UprightFont    = *-regular,
  BoldFont       = *-bold,
  ItalicFont     = *-italic,
  BoldItalicFont = *-bolditalic,
]
% No Scale: the reference sets DejaVu at its true 7.5bp, so matching lowercase
% against Heros would shrink it.
\setmonofont{DejaVuSansMono}[
  Extension      = .ttf,
  BoldFont       = *-Bold,
  ItalicFont     = *-Oblique,
  BoldItalicFont = *-BoldOblique,
]

% Body is 9.5/13.8. Paragraphs are flush-left with a 7bp skip (no indent) —
% every body line in the reference starts exactly on the column edge.
\renewcommand{\normalsize}{\fontsize{9.5bp}{13.8bp}\selectfont\color{pqink}}
\setlength{\parindent}{0bp}
\setlength{\parskip}{7bp}
\normalsize

% #1 size, #2 leading, #3 colour. Both dimensions are bp: \fontsize defaults to
% TeX pt, which is 0.4% smaller than the PDF point every measurement is in.
\newcommand{\pqface}[3]{\fontsize{#1bp}{#2bp}\selectfont\color{#3}}

% --------------------------------------------------------------- masthead -----
% Two rows: eyebrow / kicker on the left, two meta lines flush right.
\newcommand{\notemasthead}[4]{%
  \par\noindent
  \begingroup
  \begin{minipage}[t]{\textwidth}%
    {\pqface{9}{11}{pqmuted}#1}\hfill{\pqface{9}{11}{pqnavy}\bfseries#3}\par
    \vspace{4bp}
    {\pqface{9}{11}{pqnavy}\bfseries#2}\hfill{\pqface{9}{11}{pqnavy}\bfseries#4}\par
  \end{minipage}%
  \endgroup
  \par\vspace{27bp}%
}

\newcommand{\notetitle}[1]{%
  \par{\pqface{38}{38.8}{pqnavy}\bfseries\RaggedRight #1\par}%
  \par\vspace{13bp}%
}

\newcommand{\notedeck}[1]{%
  \par{\pqface{12}{16.8}{pqnavy}\RaggedRight #1\par}%
  \par\vspace{22bp}%
}

% Section head (12.5 bold navy) and subsection / run-in head (10 bold navy).
\newcommand{\notesection}[1]{%
  \par\vspace{10bp}{\pqface{12.5}{15}{pqnavy}\bfseries #1\par}\vspace{5bp}%
}
\newcommand{\notesubsection}[1]{%
  \par\vspace{7bp}{\pqface{10}{12}{pqnavy}\bfseries #1\par}\vspace{3bp}%
}

% Opening paragraph of a section, set one step larger than body.
\newcommand{\notelede}[1]{%
  \par{\pqface{11}{16.5}{pqink}#1\par}%
}

% ------------------------------------------------------- panels (shared) ------
% WeasyPrint draws these as a background plus a left border. Reproduced here by
% measuring the content box, then composing rule + padding + content inside a
% \colorbox so the border height always matches the content exactly.
\newsavebox{\pq@box}
\newlength{\pq@boxh}

\newcommand{\pq@panel}[4]{% #1 ground, #2 border colour, #3 border width, #4 content
  \par\noindent
  \begingroup
  \setlength{\fboxsep}{0bp}%
  \sbox{\pq@box}{%
    \begin{minipage}{\dimexpr\linewidth-#3-24bp\relax}%
      \vspace{11bp}#4\vspace{11bp}%
    \end{minipage}%
  }%
  \setlength{\pq@boxh}{\dimexpr\ht\pq@box+\dp\pq@box\relax}%
  \colorbox{#1}{%
    \textcolor{#2}{\rule[-\dp\pq@box]{#3}{\pq@boxh}}%
    \hspace{12bp}\usebox{\pq@box}\hspace{12bp}%
  }%
  \endgroup
  \par
}

% BOTTOM LINE — cream ground, 2.2bp navy left border, one column wide.
\newcommand{\bottomline}[2][BOTTOM LINE]{%
  \pq@panel{pqcream}{pqnavy}{2.2bp}{%
    {\pqface{9}{11}{pqnavy}\bfseries #1}\par
    \vspace{6bp}
    {\pqface{9}{13}{pqink}#2}%
  }%
}

% Reproducibility code block — lighter cream ground, same navy border.
% \VerbatimEnvironment is required: without it fancyvrb scans for a literal
% \end{Verbatim}, which never appears in the source because it lives in this
% environment's end-code.
\newenvironment{notecode}
  {\VerbatimEnvironment
   \begingroup
   \setlength{\fboxsep}{0bp}%
   \begin{lrbox}{\pq@box}%
   \begin{minipage}{\dimexpr\linewidth-2.2bp-24bp\relax}%
   \vspace{10bp}%
   \begin{Verbatim}[fontsize=\fontsize{7.5bp}{10.5bp}\selectfont]}
  {\end{Verbatim}%
   \vspace{10bp}%
   \end{minipage}%
   \end{lrbox}%
   \setlength{\pq@boxh}{\dimexpr\ht\pq@box+\dp\pq@box\relax}%
   \par\noindent
   \colorbox{pqcreamlight}{%
     \textcolor{pqnavy}{\rule[-\dp\pq@box]{2.2bp}{\pq@boxh}}%
     \hspace{12bp}\usebox{\pq@box}\hspace{12bp}%
   }%
   \endgroup\par}

% -------------------------------------------------------------- KPI row -------
% 4 cells x 124.2bp with a 12bp gutter (4*124.2 + 3*12 = 532.8, so \hfill lands
% exactly). Each cell is a 1.5bp navy top rule over label / value / caption.
\newcommand{\pqkpi}[3]{%
  \begin{minipage}[t]{124.2bp}%
    \textcolor{pqnavy}{\rule{124.2bp}{1.5bp}}\par
    \vspace{6bp}
    {\pqface{7.5}{9}{pqmuted}\bfseries #1}\par
    \vspace{4bp}
    {\pqface{18}{20}{pqnavy}\bfseries #2}\par
    \vspace{6bp}
    {\pqface{8}{10}{pqmuted}#3}%
  \end{minipage}%
}
% \ignorespaces matters: the newline after \begin{kpirow} in the source would
% otherwise emit an interword space and shove the whole row right.
\newenvironment{kpirow}
  {\par\vspace{8bp}\noindent\setlength{\parskip}{0bp}\ignorespaces}
  {\par\vspace{14bp}}

% --------------------------------------------------------------- figures ------
% Title (9 bold navy) / subtitle (8.5 muted) / full-measure image / source
% (7.5 italic muted).
\newcommand{\notefigure}[4]{%
  \par\vspace{10bp}
  {\pqface{9}{11}{pqnavy}\bfseries #2\par}
  \vspace{3bp}
  {\pqface{8.5}{10.5}{pqmuted}#3\par}
  \vspace{6bp}
  \noindent\includegraphics[width=\linewidth]{#1}\par
  \vspace{5bp}
  {\pqface{7.5}{10.5}{pqmuted}\itshape #4\par}
  \vspace{10bp}
}

\newcommand{\notesource}[1]{%
  \par\vspace{4bp}{\pqface{7.5}{10.5}{pqmuted}\itshape #1\par}%
}

% ---------------------------------------------------------- metrics table -----
% Measured column totals 207.3 / 96.6 / 135.5 / 93.4 = 532.8. \tabcolsep is 6bp
% a side, so declared widths are the totals less 12bp.
\setlength{\tabcolsep}{6bp}
\newcolumntype{M}{>{\RaggedRight\pqface{8}{11}{pqink}}p{195.3bp}}
\newcolumntype{N}{>{\RaggedLeft\pqface{8}{11}{pqink}}p{84.6bp}}
\newcolumntype{O}{>{\RaggedLeft\pqface{8}{11}{pqink}}p{123.5bp}}
\newcolumntype{P}{>{\RaggedLeft\pqface{8}{11}{pqink}}p{81.4bp}}

\newenvironment{metrictable}[4]
  {\par\vspace{6bp}\setlength{\parskip}{0bp}%
   % Fixed-width p-columns set each cell as a paragraph, so ragged alignment
   % reports underfull boxes on every numeric cell. They are cosmetic.
   \hbadness=10000\relax
   % No @{}: the reference insets cell text 6bp from the margin ('Metric' sits
   % at x=45.6) and paints the header fill across the full column. Declared
   % widths + 8 x \tabcolsep = 484.8 + 48 = 532.8, so the table spans the
   % measure exactly and \rowcolor's default overhang lands on the cell edges.
   \begin{tabular}{MNOP}
   \rowcolor{pqcream}
   {\pqface{8}{11}{pqnavy}\bfseries #1} &
   {\RaggedLeft\pqface{8}{11}{pqnavy}\bfseries #2} &
   {\RaggedLeft\pqface{8}{11}{pqnavy}\bfseries #3} &
   {\RaggedLeft\pqface{8}{11}{pqnavy}\bfseries #4} \\[-1bp]
   \arrayrulecolor{pqnavy}\specialrule{0.75bp}{0bp}{0bp}%
   \arrayrulecolor{pqrule}}
  {\end{tabular}\par\vspace{6bp}}

% Section band inside the table (RETURN, RISK-ADJUSTED, ...).
\newcommand{\bandrow}[1]{%
  \multicolumn{4}{@{}l@{}}{{\pqface{7.5}{13}{pqnavy}\bfseries #1}}\\
  \specialrule{0.75bp}{0bp}{0bp}%
}

% ------------------------------------------------------------- glossary -------
% Run-in term (9.5 bold ink) followed by the definition in body face.
\newcommand{\glossaryitem}[2]{%
  \par{\pqface{9.5}{13.8}{pqink}\textbf{#1} #2\par}%
}

% ---------------------------------------------------------- disclosures -------
\newcommand{\notedivider}{%
  \par\vspace{10bp}\noindent
  \textcolor{pqrulestrong}{\rule{\linewidth}{0.8bp}}\par\vspace{8bp}%
}

\newenvironment{disclosures}
  {\par{\pqface{7.5}{10.5}{pqinksec}}\begingroup
   \pqface{7.5}{10.5}{pqinksec}\setlength{\parskip}{5bp}}
  {\endgroup\par}

% ---------------------------------------------------------------- footer ------
% Navy tab (7.2 x 16.1 at x=39.6) then label / short title / page number,
% all 8.5 bold navy.
\newcommand{\pq@shorttitle}{}
\newcommand{\noteshorttitle}[1]{\renewcommand{\pq@shorttitle}{#1}}
\newcommand{\pq@footerlabel}{RESEARCH · QUANTITATIVE INSIGHTS}
\newcommand{\notefooterlabel}[1]{\renewcommand{\pq@footerlabel}{#1}}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0bp}
\renewcommand{\footrulewidth}{0bp}
\fancyfoot[L]{%
  \makebox[0bp][l]{\textcolor{pqnavy}{\rule[-4bp]{7.2bp}{16.1bp}}}%
  \hspace{10.2bp}{\pqface{8.5}{10}{pqnavy}\bfseries\pq@footerlabel}%
}
\fancyfoot[C]{{\pqface{8.5}{10}{pqnavy}\bfseries\pq@shorttitle}}
\fancyfoot[R]{{\pqface{8.5}{10}{pqnavy}\bfseries\thepage}}

% The cover page carries no short title in the footer.
\fancypagestyle{notecover}{%
  \fancyhf{}%
  \renewcommand{\headrulewidth}{0bp}%
  \renewcommand{\footrulewidth}{0bp}%
  \fancyfoot[L]{%
    \makebox[0bp][l]{\textcolor{pqnavy}{\rule[-4bp]{7.2bp}{16.1bp}}}%
    \hspace{10.2bp}{\pqface{8.5}{10}{pqnavy}\bfseries\pq@footerlabel}%
  }%
  \fancyfoot[R]{{\pqface{8.5}{10}{pqnavy}\bfseries\thepage}}%
}

\endinput

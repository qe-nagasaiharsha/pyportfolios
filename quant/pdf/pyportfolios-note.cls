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
\RequirePackage{enumitem}
\RequirePackage{needspace}
\RequirePackage[framemethod=TikZ]{mdframed}
\RequirePackage{amsmath}
\RequirePackage{unicode-math}
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
  % 52.9, not the measured 48.1: with \topskip zeroed the block edge sits above
  % the first glyph by its ascent, a uniform 4.8bp across every page.
  top          = 52.9bp,
  bottom       = 52bp,
  headheight   = 0bp,
  headsep      = 0bp,
  footskip     = 25.5bp,
}
% Reference columns run 39.6-295.0 and 317.0-572.4: 255.4bp each, 22bp gutter.
\setlength{\columnsep}{22bp}
% multicols' own lead-in/out has no analogue in the CSS original, where the
% column block starts flush; left at the default it pushes the body ~25bp down
% and that error compounds all the way to the BOTTOM LINE panel.
\setlength{\multicolsep}{0bp}
\setlength{\premulticols}{0bp}
\setlength{\postmulticols}{0bp}

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

% The reference note sets its few symbols in the text italic, so a serif maths
% font would read as foreign. TeX Gyre DejaVu Math is the sans OpenType maths
% font in the distribution and sits closest to Heros.
\setmathfont{texgyredejavu-math.otf}[Scale=MatchLowercase]

% Body is 9.5/13.8. Paragraphs are flush-left with a 7bp skip (no indent) —
% every body line in the reference starts exactly on the column edge.
\renewcommand{\normalsize}{\fontsize{9.5bp}{13.8bp}\selectfont\color{pqink}}
\setlength{\parindent}{0bp}
\setlength{\parskip}{7bp}
% \topskip pads the first box on a page down to a fixed baseline, which makes
% the top of the block depend on the first element's ascent (and fights any
% corrective \vspace*). Zeroed so every page starts flush at the block edge.
\setlength{\topskip}{0bp}
\normalsize

% The reference is set ragged-right (WeasyPrint's default text-align: left),
% not justified — justification is visible immediately as stretched word spaces
% and far heavier hyphenation than the original. Single sentence spacing, and a
% raised hyphenation penalty to match how little the reference breaks words.
\frenchspacing
\RaggedRight
\hyphenpenalty=500

% ragged2e's \RaggedRight leaves only 2em of stretch in \rightskip, so a
% paragraph whose words will not fall inside the measure is set overfull —
% ink past the right margin — rather than more raggedly. \emergencystretch
% only engages on the pass after TeX has failed, so paragraphs that already
% set cleanly keep their existing breaks; only the failures get extra slack.
\emergencystretch=3em

% No stranded single lines: a paragraph may not leave its first line at the foot
% of a page (club) or its last line at the head of the next (widow).
\widowpenalty=10000
\clubpenalty=10000
\displaywidowpenalty=10000
% Discouraged, not forbidden: at 10000 no page may break after a hyphenated
% line, which starves whole pages rather than preventing widows.
\brokenpenalty=500

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
    \vspace{-1bp}
    {\pqface{9}{11}{pqnavy}\bfseries#2}\hfill{\pqface{9}{11}{pqnavy}\bfseries#4}\par
  \end{minipage}%
  \endgroup
  \par\vspace{33bp}%
}

\newcommand{\notetitle}[1]{%
  \par{\pqface{38}{38.8}{pqnavy}\bfseries\RaggedRight #1\par}%
  % Negative: the 38bp line box carries far more depth than the reference's
  % gap to the deck (50.8bp baseline to baseline).
  \par\vspace{-3bp}%
}

% No hyphenation in the deck: it is three lines of display type on the cover,
% and a broken word there ("diversify-ing", "mar-ket") is the first thing a
% reader sees. Ragged right absorbs the slack instead.
\newcommand{\notedeck}[1]{%
  \par{\pqface{12}{16.8}{pqnavy}\RaggedRight\hyphenpenalty=10000\exhyphenpenalty=10000
       #1\par}%
  \par\vspace{22bp}%
}

% Gap between a heading's number and its title. 0.5em rather than \quad's 1em,
% so the number reads as attached to the title instead of floating away from it.
% em, not bp: it tracks the head's own size (6.25bp at 12.5, 5bp at 10).
% \nobreak first — the number must never be left on a line without its title.
\newcommand{\notenumsep}{\nobreak\hspace*{0.5em}}

% Section head (12.5 bold navy) and subsection / run-in head (10 bold navy).
% \nopagebreak after the head keeps it with the text that follows — a heading
% alone at the foot of a page is the most visible pagination fault there is.
\newcommand{\notesection}[1]{%
  \par\vspace{4bp}{\pqface{12.5}{15}{pqnavy}\bfseries #1\par}%
  \nopagebreak\vspace{5bp}\nopagebreak
}
\newcommand{\notesubsection}[1]{%
  % Reference gaps around a run-in head: 22.7bp in, 17.1bp out (weakness. 307.2
  % / head 329.9 / body 347.0). \parskip supplies 7bp on each side already.
  \par\vspace{4bp}{\pqface{10}{12}{pqnavy}\bfseries #1\par}%
  \nopagebreak\vspace{-4bp}\nopagebreak
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
% Built on mdframed so a listing longer than the space left on the page BREAKS
% rather than jumping wholesale to the next one. The articles carry full setup
% cells — a non-breakable panel leaves most of a page empty.
\mdfdefinestyle{pqcodepanel}{
  backgroundcolor    = pqcreamlight,
  linecolor          = pqnavy,
  linewidth          = 2.2bp,
  topline            = false,
  bottomline         = false,
  rightline          = false,
  leftline           = true,
  innerleftmargin    = 12bp,
  innerrightmargin   = 12bp,
  innertopmargin     = 10bp,
  innerbottommargin  = 10bp,
  skipabove          = 7bp,
  skipbelow          = 7bp,
  % Breakable: a listing should use the space left on the page. \pq@needroom
  % below is what stops it stranding one or two lines.
  nobreak            = false,
}

% Measures the space actually left on the page and moves the block on only when
% too little remains. Unlike \needspace this inserts no penalty, so TeX is never
% *tempted* to break here when there is room — \needspace's -100 penalty is an
% attractive breakpoint whether or not the space fits, and stranded a third of
% a page when an unbreakable figure followed.
\newcommand{\pq@needroom}[1]{%
  \par
  \ifdim\pagegoal=\maxdimen\else
    % Only act when there is genuinely a little room left. A non-positive
    % difference means the page is already past its goal and TeX is about to
    % break of its own accord; forcing \newpage there compounds the break and
    % strands whatever preceded it — that is what left a subsection head alone
    % on a 6%-full page.
    \ifdim\dimexpr\pagegoal-\pagetotal\relax>0bp
      \ifdim\dimexpr\pagegoal-\pagetotal\relax<\dimexpr#1\relax
        \newpage
      \fi
    \fi
  \fi
}

% Public form, for keeping a block whole where the author knows it should not
% split — a short two-column conclusion, say. Unlike \newpage it only breaks
% when the room is genuinely short, so it costs nothing when the block fits.
\newcommand{\noteneedroom}[1]{\pq@needroom{#1}}

% Calibrated against real builds: mdframed's split overhead is ~35bp (not the
% 17bp of padding alone), so lines-on-first-page = (room - 35) / 10.5. 56bp let
% a 2-line orphan through; 90bp was too strict and moved a block that had room
% for four. 72bp is the floor for three lines plus a little slack.
% A block holding one source line too long for the 506.6bp panel measure is set
% a little smaller rather than wrapped or reflowed — the lines are verbatim from
% the article, so every character has to survive, and this install's fancyvrb
% (3.x) has no breaklines. Leading stays at 10.5bp so the panel keeps the page's
% rhythm. Set with \codesize{7} on the line before the block; it cannot be an
% optional argument to notecode because \VerbatimEnvironment takes over the rest
% of the \begin line and reads the code's first line as stray input.
\def\pq@codesize{7.5}
\newcommand{\codesize}[1]{\def\pq@codesize{#1}}

\newenvironment{notecode}
  {\VerbatimEnvironment
   \pq@needroom{72bp}%
   \begin{mdframed}[style=pqcodepanel]%
   \begin{Verbatim}[fontsize=\fontsize{\pq@codesize bp}{10.5bp}\selectfont]}
  {\end{Verbatim}%
   \end{mdframed}%
   % One block only: the next panel is back at the default.
   \gdef\pq@codesize{7.5}}

% Printed stdout, as distinct from source. Same panel, muted border and ink so
% a reader can tell input from output at a glance.
% Output blocks run to a few lines; splitting one is never worth it.
\mdfdefinestyle{pqoutpanel}{
  style     = pqcodepanel,
  linecolor = pqrule,
  nobreak   = true,
}

\newenvironment{notecodeout}
  {\VerbatimEnvironment
   \begin{mdframed}[style=pqoutpanel]%
   \begin{Verbatim}[fontsize=\fontsize{7.5bp}{10.5bp}\selectfont,formatcom=\color{pqinksec}]}
  {\end{Verbatim}%
   \end{mdframed}}

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
  {\par\vspace{-16.7bp}\noindent\setlength{\parskip}{0bp}\ignorespaces}
  {\par\vspace{14bp}}

% ----------------------------------------------------------- project card ----
% Print form of <ProjectCard> (site/src/components/article/ProjectCard.tsx).
% Structure follows the component exactly: a "Project Card" header strip, then
% five labelled rows in its order — Category, Libraries, Assets, Timeframe,
% Use — each a label above its value, separated by a hairline. There is
% deliberately NO format row; the component notes the format already appears in
% the article header. Values come from the registry entry in lib/articles.ts.
\newsavebox{\pq@card}

\newcommand{\pq@cardrow}[2]{%
  {\pqface{7.5}{11}{pqmuted}\bfseries\textls[140]{\MakeUppercase{#1}}}\par
  \vspace{2bp}
  {\pqface{8}{11.5}{pqink}#2}\par
}

\newcommand{\pq@cardsep}{%
  \vspace{7bp}\textcolor{pqrule}{\rule{\linewidth}{0.75bp}}\par\vspace{7bp}%
}

% #1 category, #2 libraries, #3 assets, #4 timeframe, #5 use
\newcommand{\notecard}[5]{%
  \par\vspace{9bp}%
  \begingroup
  \setlength{\parskip}{0bp}%
  \setlength{\fboxsep}{0bp}%
  \setlength{\fboxrule}{0.75bp}%
  \begin{lrbox}{\pq@card}%
  \begin{minipage}{\dimexpr\linewidth-1.5bp\relax}%
    \colorbox{pqnavy}{\makebox[\linewidth][l]{%
      \rule[-5bp]{0bp}{17bp}\hspace{14bp}%
      {\pqface{7.5}{11}{white}\bfseries\textls[200]{PROJECT CARD}}}}\par
    \vspace{11bp}%
    \hspace{14bp}%
    \begin{minipage}{\dimexpr\linewidth-28bp\relax}%
      \pq@cardrow{Category}{#1}\pq@cardsep
      \pq@cardrow{Libraries}{#2}\pq@cardsep
      \pq@cardrow{Assets}{#3}\pq@cardsep
      \pq@cardrow{Timeframe}{#4}\pq@cardsep
      \pq@cardrow{Use}{#5}%
    \end{minipage}\par
    \vspace{11bp}%
  \end{minipage}%
  \end{lrbox}%
  \noindent\fcolorbox{pqrule}{white}{\usebox{\pq@card}}%
  \endgroup
  \par\vspace{9bp}%
}

% ---------------------------------------------------------------- lists -------
% The reference note carries no bullets, so this is house style rather than a
% measurement: navy marks, body type, hanging indent, tight leading. Sub-points
% use an en dash, matching how the articles render their "<br />-- " lines.
\newlist{notebullets}{itemize}{1}
\setlist[notebullets]{
  leftmargin  = 11bp,
  labelsep    = 5bp,
  labelwidth  = 6bp,
  topsep      = 4bp,
  itemsep     = 5bp,
  parsep      = 0bp,
  label       = \textcolor{pqnavy}{\rule[1.4bp]{3bp}{3bp}},
}

% beginpenalty forbids a break between a parent item's lead-in and its
% sub-points — otherwise a label like "Drift vs. noise" strands at the foot of
% a page with its dashes overleaf. midpenalty discourages splitting the
% sub-list itself without forbidding it, so a long one can still break.
\newlist{notesubbullets}{itemize}{1}
\setlist[notesubbullets]{
  leftmargin   = 9bp,
  labelsep     = 4bp,
  topsep       = 2bp,
  itemsep      = 1bp,
  parsep       = 0bp,
  label        = \textcolor{pqmuted}{--},
  beginpenalty = 10000,
  % A sub-list is never split: in two columns that would leave a group's lead-in
  % in one column and its dashes in the next. Forcing the break to fall between
  % top-level items keeps each group whole. Safe because these groups run four
  % or five lines; a group taller than a column would overflow.
  midpenalty   = 10000,
  endpenalty   = 10000,
}

% Ordered variant, for <Bullets ordered> — the site numbers these "1." "2."
\newlist{notebulletsnum}{enumerate}{1}
\setlist[notebulletsnum]{
  leftmargin  = 14bp,
  labelsep    = 5bp,
  topsep      = 4bp,
  itemsep     = 5bp,
  parsep      = 0bp,
  label       = {\pqface{9}{13.8}{pqnavy}\bfseries\arabic*.},
}

% Print form of <Pipeline>: numbered method steps, zero-padded as the component
% pads them ("01", "02"). Set inside multicols for the two-column grid it uses.
\newlist{notepipeline}{enumerate}{1}
\setlist[notepipeline]{
  leftmargin  = 20bp,
  labelsep    = 6bp,
  topsep      = 4bp,
  itemsep     = 5bp,
  parsep      = 0bp,
  % Literal leading zero rather than \ifnum on the list counter: enumitem
  % expands the label where \value{notepipelinei} is not yet assignable, which
  % errors. Pipelines run to a handful of steps, so a fixed "0" is safe; revisit
  % if one ever exceeds nine.
  label       = {\pqface{7.5}{11}{pqnavy}\bfseries 0\arabic*},
}

% ------------------------------------------------------------ references -----
% Print form of <References>: a rule, a tracked label, then a numbered list.
\newlist{notereflist}{enumerate}{1}
\setlist[notereflist]{
  leftmargin = 14bp,
  labelsep   = 5bp,
  topsep     = 3bp,
  itemsep    = 4bp,
  parsep     = 0bp,
  label      = {\pqface{8}{12}{pqmuted}\arabic*.},
}

\newenvironment{notereferences}
  {\par\vspace{12bp}%
   \noindent\textcolor{pqrulestrong}{\rule{\linewidth}{0.8bp}}\par
   \vspace{8bp}%
   {\pqface{7.5}{11}{pqmuted}\bfseries\textls[160]{REFERENCES}\par}%
   \vspace{2bp}%
   \begin{notereflist}}
  {\end{notereflist}\par}

% --------------------------------------------------------------- figures ------
% Title (9 bold navy) / subtitle (8.5 muted) / full-measure image / source
% (7.5 italic muted).
% Wrapped in a minipage so the block is atomic: a breakable figure strands the
% source line on the next page and costs a whole page per figure.
% Internal gaps measured off Figure 1 (title 271.1, subtitle 284.5, image 299.5,
% image foot 479.3, source 484.0).
\newcommand{\notefigure}[4]{%
  \par\vspace{2bp}%
  \noindent\begin{minipage}{\linewidth}%
    \setlength{\parskip}{0bp}%
    {\pqface{9}{11}{pqnavy}\bfseries #2\par}%
    \vspace{2bp}
    {\pqface{8.5}{10.5}{pqmuted}#3\par}%
    \vspace{5bp}
    % Height cap: the reference's own figures are wide and short (aspect 3-5),
    % but the article charts run nearer 2:1 and at full measure would stand
    % ~265bp tall, dominating the page and stranding whole blocks. Wide figures
    % are unaffected and still fill the measure.
    \noindent\makebox[\linewidth][c]{%
      \includegraphics[width=\linewidth,height=205bp,keepaspectratio]{#1}}\par
    \vspace{3bp}
    {\pqface{7.5}{10.5}{pqmuted}\itshape #4\par}%
  \end{minipage}\par
  \vspace{2bp}%
}

% The articles' own <Figure> carries a single caption BELOW the image, under a
% hairline (see site/src/components/article/prose.tsx) — no subtitle, no source
% line. This variant mirrors that structure; \notefigure above is for notes
% authored to the reference's four-part figure block.
% A figure block is atomic, so one that misses the foot of a page by a hair
% costs the whole remainder — the first draft missed by 0.6bp and pushed 240bp
% of white. So: typeset it, measure it, and if it overshoots the space left by
% only a little, shrink the image just enough to fit rather than move it. Below
% \pq@figmin of usable space it moves as before.
\newlength{\pq@figh}
\newlength{\pq@figroom}
\newlength{\pq@figcap}
\newcommand{\pq@figmax}{205bp}   % default cap: keeps ~2:1 charts off a full page
\newcommand{\pq@figmin}{150bp}   % below this, don't bother shrinking — move it

\newcommand{\pq@figbody}[3]{% #1 file, #2 caption, #3 image height
  \noindent\begin{minipage}{\linewidth}%
    \setlength{\parskip}{0bp}%
    \noindent\makebox[\linewidth][c]{%
      \includegraphics[width=\linewidth,height=#3,keepaspectratio]{#1}}\par
    \vspace{6bp}
    \textcolor{pqrule}{\rule{\linewidth}{0.75bp}}\par
    \vspace{4bp}
    {\pqface{7.5}{10.5}{pqmuted}#2\par}%
  \end{minipage}%
}

\newcommand{\notefigureplain}[2]{%
  \par\vspace{2bp}%
  \begingroup
  % measure the block at full size
  \sbox{\pq@box}{\pq@figbody{#1}{#2}{\pq@figmax}}%
  \setlength{\pq@figh}{\dimexpr\ht\pq@box+\dp\pq@box\relax}%
  % the block's non-image overhead — caption, rule and gaps
  \setlength{\pq@figcap}{\dimexpr\pq@figh-\pq@figmax\relax}%
  \setlength{\pq@figroom}{\maxdimen}%
  \ifdim\pagegoal<\maxdimen
    \setlength{\pq@figroom}{\dimexpr\pagegoal-\pagetotal-4bp\relax}%
  \fi
  \ifdim\pq@figh>\pq@figroom
    \ifdim\pq@figroom>\pq@figmin
      % close enough to be worth shrinking: fit the image to what is left
      \sbox{\pq@box}{\pq@figbody{#1}{#2}{\dimexpr\pq@figroom-\pq@figcap\relax}}%
    \fi
  \fi
  \noindent\usebox{\pq@box}%
  \endgroup
  \par\vspace{2bp}%
}

\newcommand{\notesource}[1]{%
  \par\vspace{4bp}{\pqface{7.5}{10.5}{pqmuted}\itshape #1\par}%
}

% ---------------------------------------------------------- metrics table -----
% Measured column totals 207.3 / 96.6 / 135.5 / 93.4 = 532.8. \tabcolsep is 6bp
% a side, so declared widths are the totals less 12bp.
\setlength{\tabcolsep}{6bp}
% \parskip must be zeroed per cell: each p-cell is its own paragraph, and the
% document's 7bp \parskip would otherwise be added to every row.
\newcommand{\pq@cell}{\setlength{\parskip}{0bp}\pqface{8}{11}{pqink}}
\newcolumntype{M}{>{\RaggedRight\pq@cell}p{195.3bp}}
\newcolumntype{N}{>{\RaggedLeft\pq@cell}p{84.6bp}}
\newcolumntype{O}{>{\RaggedLeft\pq@cell}p{123.5bp}}
\newcolumntype{P}{>{\RaggedLeft\pq@cell}p{81.4bp}}

\newenvironment{metrictable}[4]
  {\par\vspace{6bp}\setlength{\parskip}{0bp}%
   % Reference data rows sit on a 17.75bp pitch (331.7 / 349.5 / 367.2).
   % Selecting the cell face here rebuilds \strutbox at 11bp leading, so
   % \@arstrut sizes off the table's type rather than the document's 13.8bp.
   \pqface{8}{11}{pqink}%
   % Calibrated: stretch 1.0 gives 19.45bp pitch, 0.845 gives 16.56 — 18.65bp
   % of pitch per unit stretch, so 0.909 lands on the reference's 17.75.
   \renewcommand{\arraystretch}{0.909}%
   % Fixed-width p-columns set each cell as a paragraph, so ragged alignment
   % reports underfull boxes on every numeric cell. They are cosmetic.
   \hbadness=10000\relax
   % No @{}: the reference insets cell text 6bp from the margin ('Metric' sits
   % at x=45.6) and paints the header fill across the full column. Declared
   % widths + 8 x \tabcolsep = 484.8 + 48 = 532.8, so the table spans the
   % measure exactly and \rowcolor's default overhang lands on the cell edges.
   \begin{tabular}{MNOP}
   \rowcolor{pqcream}
   {\rule[-4.9bp]{0bp}{11.4bp}\pqface{8}{11}{pqnavy}\bfseries #1} &
   {\RaggedLeft\pqface{8}{11}{pqnavy}\bfseries #2} &
   {\RaggedLeft\pqface{8}{11}{pqnavy}\bfseries #3} &
   {\RaggedLeft\pqface{8}{11}{pqnavy}\bfseries #4} \\[-1bp]
   \arrayrulecolor{pqnavy}\specialrule{0.75bp}{0bp}{0bp}%
   \arrayrulecolor{pqrule}}
  {\end{tabular}\par\vspace{6bp}}

% Section band inside the table (RETURN, RISK-ADJUSTED, ...). The light cream
% marks these band rows — the reference has no zebra striping on data rows.
% The invisible rule sets the band's fill height to the measured 18.6bp
% (reference fill runs 308.2 -> 326.8); 7.5bp type alone gives only 10bp.
\newcommand{\bandrow}[1]{%
  \rowcolor{pqcreamlight}
  \multicolumn{4}{l}{\rule[-5.6bp]{0bp}{18.6bp}{\pqface{7.5}{13}{pqnavy}\bfseries #1}}\\
}

% Hairline between data rows. Emitted explicitly after each \\ so the caller
% (and the Phase 3 generator) controls where rules land.
\newcommand{\rowrule}{\arrayrulecolor{pqrule}\specialrule{0.75bp}{0bp}{0bp}}

% -------------------------------------------------------------- callout ------
% Print form of <Callout kind="...">: a kind label over the body, against a
% 2.2bp navy left rule on the light cream ground — the same panel language as
% the code blocks, so asides read as a sibling of those rather than a new idea.
\newcommand{\notecallout}[2]{%
  \pq@panel{pqcreamlight}{pqnavy}{2.2bp}{%
    {\pqface{7.5}{11}{pqnavy}\bfseries\textls[160]{\MakeUppercase{#1}}}\par
    \vspace{5bp}
    {\pqface{9}{13}{pqink}#2}%
  }%
}

% ----------------------------------------------------------- prose table -----
% Print form of <DataTable variant="prose">: header cells in navy over a 0.75bp
% navy rule, body rows separated by hairlines, everything left-aligned and
% top-aligned as the component sets it. Column spec is the caller's, since
% these tables vary in width and column count between articles.
% Not \headrule: fancyhdr already owns that name and silently wins.
\newcommand{\thcell}[1]{{\pqface{8}{11}{pqnavy}\bfseries #1}}
\newcommand{\theadrule}{%
  \arrayrulecolor{pqnavy}\specialrule{0.75bp}{2bp}{2bp}\arrayrulecolor{pqrule}}

\newenvironment{notetable}[1]
  {\par\vspace{8bp}\begingroup
   \setlength{\parskip}{0bp}%
   \pqface{8}{11.5}{pqink}%
   \renewcommand{\arraystretch}{1.25}%
   \arrayrulecolor{pqrule}%
   \noindent\begin{tabular}{#1}}
  {\end{tabular}\endgroup\par\vspace{8bp}}

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

% The footer mark is a border, not a solid tab: the reference's nested rects
% share their x bounds, so only the horizontal edges are painted — a 1.5bp rule
% at y=753.4 and a 0.7bp rule at y=768.7. The footer baseline sits at y=765.5.
\newcommand{\pq@foottab}{%
  \makebox[0bp][l]{\textcolor{pqnavy}{%
    \rule[10.6bp]{7.2bp}{1.5bp}\hspace{-7.2bp}\rule[-3.9bp]{7.2bp}{0.7bp}}}%
}
\newcommand{\notefooterlabel}[1]{\renewcommand{\pq@footerlabel}{#1}}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0bp}
\renewcommand{\footrulewidth}{0bp}
\fancyfoot[L]{%
  \pq@foottab
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
    \pq@foottab
    \hspace{10.2bp}{\pqface{8.5}{10}{pqnavy}\bfseries\pq@footerlabel}%
  }%
  \fancyfoot[R]{{\pqface{8.5}{10}{pqnavy}\bfseries\thepage}}%
}

\endinput

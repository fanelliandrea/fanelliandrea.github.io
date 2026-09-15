/* 097 — lines tighten as you read.
   Each paragraph line enters with its words spread across the page and
   gathers to normal spacing as it scrolls up, scrubbed to the scroll.
   Transform only; skipped entirely under reduced motion. */
(() => {
  const { $$, reduced } = window.Site;
  if (reduced || !window.gsap || !window.SplitText || !window.ScrollTrigger) return;

  Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(() => {
    $$('.prose p').forEach(p => {
      let triggers = [];
      SplitText.create(p, {
        type: 'lines,words', linesClass: 'ln', wordsClass: 'wd', autoSplit: true,
        onSplit(self) {
          triggers.forEach(t => t.kill(true));
          const spread = Math.min(28, innerWidth * 0.022);
          triggers = self.lines.map(line => {
            const words = [...line.querySelectorAll('.wd')];
            const mid = (words.length - 1) / 2;
            return gsap.fromTo(words,
              { x: i => (i - mid) * spread, opacity: 0.25 },
              { x: 0, opacity: 1, ease: 'none',
                scrollTrigger: { trigger: line, start: 'top 96%', end: 'top 58%', scrub: 0.6 } }
            ).scrollTrigger;
          });
        },
      });
    });
  });
})();

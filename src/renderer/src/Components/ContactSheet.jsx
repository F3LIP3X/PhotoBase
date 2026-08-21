/* Stand-in frames until a real library is indexed. Cool, desaturated
   tones only: the sheet sits under the glass chrome, and a loud grid
   would fight the ambient field rather than feed it. */
function frameStyle(seed) {
  const hue = 196 + ((seed * 23) % 74);
  const light = 46 + ((seed * 11) % 16);
  return {
    backgroundImage: `linear-gradient(155deg,
      hsl(${hue} 32% ${light}%),
      hsl(${hue + 18} 26% ${light - 14}%))`,
  };
}

/* Every fifth frame gets a 2×2 footprint so the sheet has rhythm
   instead of reading as a uniform wall of identical squares. */
const isFeature = (index) => index % 5 === 2;

const ContactSheet = ({ groups }) => (
  <>
    {groups.map(({ date, place, count }, groupIndex) => (
      <section key={`${place}-${date}`} className="mb-10 last:mb-0">
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="text-[15px] text-ink">{place}</h2>
          <span className="eyebrow text-ink-3">{date}</span>
          <span className="h-px flex-1 bg-[var(--glass-brd)]" />
          <span className="eyebrow text-ink-3">{count}</span>
        </div>

        <div className="grid auto-rows-[112px] grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              style={frameStyle(groupIndex * 7 + index + 1)}
              className={`group relative overflow-hidden rounded-sm shadow-sm transition-transform duration-300 ease-glass hover:z-10 hover:scale-[1.04] ${
                isFeature(index) ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </section>
    ))}
  </>
);

export default ContactSheet;

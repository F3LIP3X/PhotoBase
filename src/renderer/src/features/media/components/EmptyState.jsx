/* An empty screen is an invitation to act: say what goes here and how
   to put it there, never just "no hay nada". */
const EmptyState = ({ icon: Icon, title, hint, children }) => (
  <div className="flex flex-col items-center px-6 py-20 text-center">
    <span className="glass mb-5 flex h-14 w-14 items-center justify-center rounded-md">
      <Icon className="text-[22px] text-ink-3" />
    </span>
    <h2 className="text-[17px] text-ink">{title}</h2>
    <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-2">{hint}</p>
    {children && <div className="mt-6">{children}</div>}
  </div>
);

export default EmptyState;

export const SectionLabel = ({ children }: { children: unknown }) => (
  <div class="section-label">
    <span aria-hidden="true" />
    <span>{children}</span>
    <span aria-hidden="true" />
  </div>
);

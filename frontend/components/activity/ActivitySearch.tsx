type ActivitySearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ActivitySearch({ value, onChange }: ActivitySearchProps) {
  return (
    <section className="card" style={{ padding: "1rem" }}>
      <label htmlFor="activity-search" style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
        Search activity
      </label>
      <input
        id="activity-search"
        type="search"
        className="input"
        placeholder="Filter by action or info"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}

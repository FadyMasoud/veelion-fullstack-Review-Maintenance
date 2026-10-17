import { Search } from "lucide-react";
import styles from "./SearchInput.module.css";

type SearchInputProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ id, label, placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className={styles.field}>
      {/* Visually hidden, but screen readers still announce what the field is for. */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search size={16} className={styles.icon} aria-hidden="true" />
      <input
        id={id}
        type="search"
        className={`input ${styles.input}`}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

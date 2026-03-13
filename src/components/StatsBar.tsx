import type { SeverityLevel, Vulnerability } from "../types";

interface StatsBarProps {
  vulnerabilities: Vulnerability[];
}

const SEVERITY_ORDER: SeverityLevel[] = ["Critical", "High", "Medium", "Low", "Unknown"];

function countBySeverity(vulnerabilities: Vulnerability[]): Record<SeverityLevel, number> {
  const counts: Record<SeverityLevel, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Unknown: 0,
  };

  for (const vulnerability of vulnerabilities) {
    const severity = SEVERITY_ORDER.includes(vulnerability.severity)
      ? vulnerability.severity
      : "Unknown";
    counts[severity] += 1;
  }

  return counts;
}

export function StatsBar({ vulnerabilities }: StatsBarProps) {
  const counts = countBySeverity(vulnerabilities);

  return (
    <div className="stats-bar">
      {SEVERITY_ORDER.map((severity) => (
        <div key={severity} className={`stat-card ${severity.toLowerCase()}`}>
          <span className="stat-label">{severity}</span>
          <span className="stat-count">{counts[severity]}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniStats({ vulnerabilities }: StatsBarProps) {
  const counts = countBySeverity(vulnerabilities);

  return (
    <div className="file-section-stats">
      {SEVERITY_ORDER.map((severity) =>
        counts[severity] > 0 ? (
          <span key={severity} className={`mini-stat ${severity.toLowerCase()}`}>
            {counts[severity]} {severity}
          </span>
        ) : null,
      )}
      <span className="total-badge">{vulnerabilities.length} total</span>
    </div>
  );
}

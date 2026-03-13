export interface ScanReport {
  version: string;
  scan: {
    analyzer: {
      id: string;
      name: string;
      vendor: { name: string };
      version: string;
    };
    end_time: string;
    scanner: {
      id: string;
      name: string;
      url: string;
      vendor: { name: string };
      version: string;
    };
    start_time: string;
    status: string;
    type: string;
  };
  vulnerabilities: Vulnerability[];
  remediations: unknown[];
}

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  solution: string;
  location: {
    dependency: {
      package: { name: string };
      version: string;
    };
    operating_system: string;
    image: string;
  };
  identifiers: Identifier[];
  links: Link[];
}

export type SeverityLevel = "Critical" | "High" | "Medium" | "Low" | "Unknown";

export interface Identifier {
  type: string;
  name: string;
  value: string;
  url: string;
}

export interface Link {
  url: string;
}

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileNode[];
}

export interface FileReport {
  fileName: string;
  filePath: string;
  report: ScanReport;
}

import { NextResponse } from "next/server";

// Define a type for the license names
type LicenseType =
  | "None"
  | "Apache-2.0"
  | "GPL-3.0"
  | "MIT"
  | "BSD-2-Clause"
  | "BSD-3-Clause"
  | "BSL-1.0"
  | "CC0-1.0"
  | "EPL-2.0"
  | "AGPL-3.0"
  | "GPL-2.0"
  | "LGPL-2.1"
  | "MPL-2.0"
  | "Unlicense";

const licenses: Record<LicenseType, string[]> = {
  None: [],
  "Apache-2.0": [
    "permissive",
    "patent_protection",
    "commercial_use",
    "distribute_source",
  ],
  "GPL-3.0": [
    "strong_copyleft",
    "commercial_use",
    "distribute_source",
    "patent_protection",
  ],
  MIT: ["permissive", "simple", "commercial_use"],
  "BSD-2-Clause": ["permissive", "simple", "commercial_use"],
  "BSD-3-Clause": ["permissive", "simple", "commercial_use"],
  "BSL-1.0": ["permissive", "simple", "commercial_use"],
  "CC0-1.0": ["public_domain", "permissive", "commercial_use"],
  "EPL-2.0": ["weak_copyleft", "commercial_use", "patent_protection"],
  "AGPL-3.0": ["strong_copyleft", "network_use", "commercial_use"],
  "GPL-2.0": ["strong_copyleft", "commercial_use", "distribute_source"],
  "LGPL-2.1": ["weak_copyleft", "library", "commercial_use"],
  "MPL-2.0": ["file_level_copyleft", "commercial_use", "patent_protection"],
  Unlicense: ["public_domain", "permissive", "commercial_use"],
};

const criteria = [
  "commercial_use",
  "permissive",
  "copyleft",
  "patent_protection",
  "copyleft",
  "library",
  "permissive",
  "network_use",
  "simple",
  "public_domain",
];

export async function POST(request: Request) {
  const { answers } = await request.json();
  const suggestions = suggestLicenses(answers);
  return NextResponse.json(suggestions);
}

function suggestLicenses(answers: boolean[]) {
  let compatibility: { [key in LicenseType]: number } = {
    None: 0,
    "Apache-2.0": 0,
    "GPL-3.0": 0,
    MIT: 0,
    "BSD-2-Clause": 0,
    "BSD-3-Clause": 0,
    "BSL-1.0": 0,
    "CC0-1.0": 0,
    "EPL-2.0": 0,
    "AGPL-3.0": 0,
    "GPL-2.0": 0,
    "LGPL-2.1": 0,
    "MPL-2.0": 0,
    Unlicense: 0,
  };

  answers.forEach((answer, i) => {
    if (answer) {
      for (let license in licenses) {
        if (licenses[license as LicenseType].includes(criteria[i])) {
          compatibility[license as LicenseType] += 1;
        }
      }
    }
  });

  return Object.entries(compatibility)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // Return top 3
}

import { NextResponse } from "next/server";

// Define a type for the license names with full names
type LicenseType =
  | "None"
  | "Apache License 2.0"
  | "GNU General Public License v3.0"
  | "MIT License"
  | "BSD 2-Clause License"
  | "BSD 3-Clause License"
  | "Boost Software License 1.0"
  | "Creative Commons Zero v1.0 Universal"
  | "Eclipse Public License 2.0"
  | "GNU Affero General Public License v3.0"
  | "GNU General Public License v2.0"
  | "GNU Lesser General Public License v2.1"
  | "Mozilla Public License 2.0"
  | "The Unlicense";

const licenses: Record<LicenseType, { criteria: string[]; link: string }> = {
  None: { criteria: [], link: "https://www.example.com" },
  "Apache License 2.0": {
    criteria: ["permissive", "patent_protection", "commercial_use"],
    link: "https://www.apache.org/licenses/LICENSE-2.0",
  },
  "GNU General Public License v3.0": {
    criteria: ["strong_copyleft", "commercial_use", "patent_protection"],
    link: "https://www.gnu.org/licenses/gpl-3.0.html",
  },
  "MIT License": {
    criteria: ["permissive", "simple", "commercial_use"],
    link: "https://opensource.org/licenses/MIT",
  },
  "BSD 2-Clause License": {
    criteria: ["permissive", "simple", "commercial_use"],
    link: "https://opensource.org/licenses/BSD-2-Clause",
  },
  "BSD 3-Clause License": {
    criteria: ["permissive", "simple", "commercial_use"],
    link: "https://opensource.org/licenses/BSD-3-Clause",
  },
  "Boost Software License 1.0": {
    criteria: ["permissive", "simple", "commercial_use"],
    link: "https://www.boost.org/users/licensing/boost_1_0_licenses.html",
  },
  "Creative Commons Zero v1.0 Universal": {
    criteria: ["public_domain", "permissive", "commercial_use"],
    link: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "Eclipse Public License 2.0": {
    criteria: ["weak_copyleft", "commercial_use", "patent_protection"],
    link: "https://www.eclipse.org/legal/epl-2.0/",
  },
  "GNU Affero General Public License v3.0": {
    criteria: ["strong_copyleft", "network_use", "commercial_use"],
    link: "https://www.gnu.org/licenses/agpl-3.0.html",
  },
  "GNU General Public License v2.0": {
    criteria: ["strong_copyleft", "commercial_use"],
    link: "https://www.gnu.org/licenses/gpl-2.0.html",
  },
  "GNU Lesser General Public License v2.1": {
    criteria: ["weak_copyleft", "library", "commercial_use"],
    link: "https://www.gnu.org/licenses/lgpl-2.1.html",
  },
  "Mozilla Public License 2.0": {
    criteria: ["file_level_copyleft", "commercial_use"],
    link: "https://mozilla.org/en-US/MPL/2.0/",
  },
  "The Unlicense": {
    criteria: ["public_domain", "permissive"],
    link: "https://unlicense.org/",
  },
};

// Refined criteria array based on the descriptions
const criteria = [
  "commercial_use",
  "strong_copyleft",
  "weak_copyleft",
  "patent_protection",
  "network_use",
  "public_domain",
  "simple",
];

// Suggest licenses based on user answers
function suggestLicenses(answers: boolean[]) {
  let compatibility: { [key in LicenseType]: number } = {
    None: 0,
    "Apache License 2.0": 0,
    "GNU General Public License v3.0": 0,
    "MIT License": 0,
    "BSD 2-Clause License": 0,
    "BSD 3-Clause License": 0,
    "Boost Software License 1.0": 0,
    "Creative Commons Zero v1.0 Universal": 0,
    "Eclipse Public License 2.0": 0,
    "GNU Affero General Public License v3.0": 0,
    "GNU General Public License v2.0": 0,
    "GNU Lesser General Public License v2.1": 0,
    "Mozilla Public License 2.0": 0,
    "The Unlicense": 0,
  };

  answers.forEach((answer, i) => {
    if (answer) {
      for (let license in licenses) {
        if (licenses[license as LicenseType].criteria.includes(criteria[i])) {
          compatibility[license as LicenseType] += 1;
        }
      }
    }
  });

  // Return the top 3 licenses with their links
  return Object.entries(compatibility)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([license]) => ({
      license,
      link: licenses[license as LicenseType].link,
    }));
}

export async function POST(request: Request) {
  const { answers } = await request.json();

  const suggestions = suggestLicenses(answers);
  return NextResponse.json({ suggestions });
}

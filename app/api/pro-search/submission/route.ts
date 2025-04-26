import { NextResponse } from "next/server";
import { db } from "@/lib/db/index"; // Importing your database connection
import { getUserAuth } from "@/lib/auth/utils"; // Assuming your authentication utils are in this file

export async function POST(request: Request) {
  const { answers } = await request.json();
  const { session } = await getUserAuth();

  if (!session) {
    return NextResponse.json({ error: "User not logged in." }, { status: 403 });
  }

  const userId = await session.user.id;
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    // If the user doesn't exist, return 401 Unauthorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 3: Check if the user is a 'pro' user
  if (!user.isPro) {
    // If not a pro user, return 403 Forbidden
    return NextResponse.json(
      { error: "Forbidden: You need to be a pro user" },
      { status: 403 }
    );
  }
  const suggestions = suggestLicenses(answers);
  return NextResponse.json({ suggestions });
}

// Define a type for the license names
type LicenseType =
  | "The Unlicense"
  | "PHP License 3.01"
  | "Cryptographic Autonomy License"
  | "Mulan Permissive Software License v2"
  | "OpenLDAP Public License Version 2.8"
  | "1-clause BSD License"
  | "Lawrence Berkeley National Labs BSD Variant License"
  | "Eclipse Public License version 2.0"
  | "GNU Library General Public License version 2"
  | "Upstream Compatibility License v1.0"
  | "BSD+Patent"
  | "Licence Libre du Québec  Réciprocité forte version 1.1"
  | "Licence Libre du Québec  Réciprocité version 1.1"
  | "Licence Libre du Québec  Permissive version 1.1"
  | "OSET Public License version 2.1"
  | "eCos License version 2.0"
  | "Zero-Clause BSD"
  | "The Universal Permissive License Version 1.0"
  | "Cea Cnrs Inria Logiciel Libre License, version 2.1"
  | "Artistic License (Perl) 1.0"
  | "Mozilla Public License 2.0"
  | "European Union Public License, version 1.2"
  | "The 3-Clause BSD License"
  | "LaTeX Project Public License, Version 1.3c"
  | "GNU General Public License, version 1"
  | "The PostgreSQL Licence"
  | "IPA Font License"
  | "SIL OPEN FONT LICENSE"
  | "MirOS License"
  | "Non-Profit Open Software License version 3.0"
  | "NTP License"
  | "GNU Affero General Public License version 3"
  | "ISC License"
  | "Reciprocal Public License 1.5"
  | "Boost Software License 1.0"
  | "Multics License"
  | "Open Software License 2.1"
  | "Simple Public License 2.0"
  | "GNU Lesser General Public License version 3"
  | "GNU General Public License version 3"
  | "Microsoft Reciprocal License"
  | "Microsoft Public License"
  | "Artistic License 2.0"
  | "Educational Community License, Version 2.0"
  | "Eclipse Public License -v 1.0"
  | "Common Public Attribution License Version 1.0"
  | "Common Public License Version 1.0"
  | "Open Software License, version 1.0"
  | "Mozilla Public License 1.1"
  | "The X.Net, Inc. License"
  | "The MIT License"
  | "Motosoto Open Source License"
  | "Mozilla Public License, version 1.0"
  | "Eiffel Forum License, Version 2"
  | "Eiffel Forum License, version 1"
  | "MITRE Collaborative Virtual Workspace License"
  | "Attribution Assurance License"
  | "The W3C® Software and Document license"
  | "The zlib/libpng License"
  | "The wxWindows Library Licence"
  | "EU DataGrid Software License"
  | "Artistic License 1.0"
  | "Zope Public License 2.0"
  | "Academic Free License v. 3.0"
  | "The University of Illinois/NCSA Open Source License"
  | "Sun Public License, Version 1.0"
  | "Sun Industry Standards Source License"
  | "Apache Software License, version 1.1"
  | "The Vovida Software License v. 1.0"
  | "The Sleepycat License"
  | "The Ricoh Source Code Public License"
  | "Reciprocal Public License, version 1.1"
  | "RealNetworks Public Source License Version 1.0"
  | "The Q Public License Version 1.0"
  | "Python License, Version 2"
  | "The CNRI portion of the multi-part Python License"
  | "The Nethack General Public License"
  | "Nokia Open Source License Version 1.0a"
  | "The OCLC Research Public License 2.0 License"
  | "Open Group Test Suite License"
  | "The Open Software License 3.0"
  | "PHP License 3.0"
  | "Apache License 2.0"
  | "Creative Commons Zero v1.0 Universal"
  | "BSD 2-Clause License"
  | "GNU General Public License v2.0";

// Define 25 criteria tags
const criteria = [
  "permissive",
  "copyleft",
  "strong_copyleft",
  "weak_copyleft",
  "commercial_use",
  "patent_protection",
  "trademark_protection",
  "network_use",
  "public_domain",
  "simple",
  "modification",
  "distribution",
  "private_use",
  "sublicensing",
  "state_changes",
  "liability",
  "warranty",
  "attribution",
  "disclose_source",
  "same_license",
  "license_and_copyright_notice",
  "network_use_disclose_source",
  "document_changes",
  "library_usage",
  "software_package_usage",
];

const licenses: Record<LicenseType, { criteria: string[]; link: string }> = {
  "The Unlicense": {
    criteria: [
      "permissive",
      "public_domain",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://unlicense.org/",
  },
  "PHP License 3.01": {
    criteria: [
      "permissive",
      "commercial_use",
      "modification",
      "distribution",
      "attribution",
    ],
    link: "https://opensource.org/licenses/PHP-3.01",
  },
  "Cryptographic Autonomy License": {
    criteria: [
      "copyleft",
      "commercial_use",
      "modification",
      "distribution",
      "network_use",
    ],
    link: "https://opensource.org/licenses/CAL-1.0",
  },
  "Mulan Permissive Software License v2": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/MulanPSL-2.0",
  },
  "OpenLDAP Public License Version 2.8": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://www.openldap.org/software/release/license.html",
  },
  "1-clause BSD License": {
    criteria: [
      "permissive",
      "commercial_use",
      "modification",
      "distribution",
      "simple",
    ],
    link: "https://opensource.org/licenses/BSD-1-Clause",
  },
  "Lawrence Berkeley National Labs BSD Variant License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://spdx.org/licenses/BSD-3-Clause-LBNL.html",
  },
  "Eclipse Public License version 2.0": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://www.eclipse.org/legal/epl-2.0/",
  },
  "GNU Library General Public License version 2": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "modification",
      "distribution",
      "library_usage",
    ],
    link: "https://www.gnu.org/licenses/old-licenses/lgpl-2.0.html",
  },
  "Upstream Compatibility License v1.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/UCL-1.0",
  },
  "BSD+Patent": {
    criteria: [
      "permissive",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/BSDplusPatent",
  },
  "Licence Libre du Québec  Réciprocité forte version 1.1": {
    criteria: [
      "strong_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://www.forge.gouv.qc.ca/participez/licence-logicielle/licence-libre-du-quebec-liliq-en-francais/licence-libre-du-quebec-reciprocite-forte-v1-1-liliq-r-v1-1/",
  },
  "Licence Libre du Québec  Réciprocité version 1.1": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://www.forge.gouv.qc.ca/participez/licence-logicielle/licence-libre-du-quebec-liliq-en-francais/licence-libre-du-quebec-reciprocite-v1-1-liliq-r-v1-1/",
  },
  "Licence Libre du Québec  Permissive version 1.1": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://www.forge.gouv.qc.ca/participez/licence-logicielle/licence-libre-du-quebec-liliq-en-francais/licence-libre-du-quebec-permissive-v1-1-liliq-p-v1-1/",
  },
  "OSET Public License version 2.1": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/OPL-2.1",
  },
  "eCos License version 2.0": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/eCos-2.0",
  },
  "Zero-Clause BSD": {
    criteria: [
      "permissive",
      "public_domain",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/0BSD",
  },
  "The Universal Permissive License Version 1.0": {
    criteria: [
      "permissive",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/UPL",
  },
  "Cea Cnrs Inria Logiciel Libre License, version 2.1": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/CECILL-2.1",
  },
  "Artistic License (Perl) 1.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Artistic-1.0",
  },
  "Mozilla Public License 2.0": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/MPL-2.0",
  },
  "European Union Public License, version 1.2": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/EUPL-1.2",
  },
  "The 3-Clause BSD License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/BSD-3-Clause",
  },
  "LaTeX Project Public License, Version 1.3c": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/LPPL-1.3c",
  },
  "GNU General Public License, version 1": {
    criteria: [
      "strong_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://www.gnu.org/licenses/old-licenses/gpl-1.0.html",
  },
  "The PostgreSQL Licence": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/PostgreSQL",
  },
  "IPA Font License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/IPA",
  },
  "SIL OPEN FONT LICENSE": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/OFL-1.1",
  },
  "MirOS License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/MirOS",
  },
  "Non-Profit Open Software License version 3.0": {
    criteria: ["copyleft", "non_profit", "modification", "distribution"],
    link: "https://opensource.org/licenses/NPOSL-3.0",
  },
  "NTP License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/NTP",
  },
  "GNU Affero General Public License version 3": {
    criteria: [
      "strong_copyleft",
      "commercial_use",
      "modification",
      "distribution",
      "network_use",
    ],
    link: "https://www.gnu.org/licenses/agpl-3.0.html",
  },
  "ISC License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/ISC",
  },
  "Reciprocal Public License 1.5": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/RPL-1.5",
  },
  "Boost Software License 1.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://www.boost.org/LICENSE_1_0.txt",
  },
  "Multics License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Multics",
  },
  "Open Software License 2.1": {
    criteria: [
      "copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/OSL-2.1",
  },
  "Simple Public License 2.0": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/SimPL-2.0",
  },
  "GNU Lesser General Public License version 3": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "modification",
      "distribution",
      "library_usage",
    ],
    link: "https://www.gnu.org/licenses/lgpl-3.0.html",
  },
  "GNU General Public License version 3": {
    criteria: [
      "strong_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://www.gnu.org/licenses/gpl-3.0.html",
  },
  "Microsoft Reciprocal License": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/MS-RL",
  },
  "Microsoft Public License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/MS-PL",
  },
  "Artistic License 2.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Artistic-2.0",
  },
  "Educational Community License, Version 2.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/ECL-2.0",
  },
  "Eclipse Public License -v 1.0": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://www.eclipse.org/legal/epl-v10.html",
  },
  "Common Public Attribution License Version 1.0": {
    criteria: [
      "copyleft",
      "commercial_use",
      "modification",
      "distribution",
      "attribution",
    ],
    link: "https://opensource.org/licenses/CPAL-1.0",
  },
  "Common Public License Version 1.0": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/CPL-1.0",
  },
  "Open Software License, version 1.0": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/OSL-1.0",
  },
  "Mozilla Public License 1.1": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/MPL-1.1",
  },
  "The X.Net, Inc. License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Xnet",
  },
  "The MIT License": {
    criteria: [
      "permissive",
      "commercial_use",
      "modification",
      "distribution",
      "simple",
    ],
    link: "https://opensource.org/licenses/MIT",
  },
  "Motosoto Open Source License": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Motosoto",
  },
  "Mozilla Public License, version 1.0": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/MPL-1.0",
  },
  "Eiffel Forum License, Version 2": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/EFL-2.0",
  },
  "Eiffel Forum License, version 1": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/EFL-1.0",
  },
  "MITRE Collaborative Virtual Workspace License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/CVW",
  },
  "Attribution Assurance License": {
    criteria: [
      "permissive",
      "commercial_use",
      "modification",
      "distribution",
      "attribution",
    ],
    link: "https://opensource.org/licenses/AAL",
  },
  "The W3C® Software and Document license": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document",
  },
  "The zlib/libpng License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Zlib",
  },
  "The wxWindows Library Licence": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/wxWindows",
  },
  "EU DataGrid Software License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/EUDatagrid",
  },
  "Artistic License 1.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Artistic-1.0",
  },
  "Zope Public License 2.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/ZPL-2.0",
  },
  "Academic Free License v. 3.0": {
    criteria: [
      "permissive",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/AFL-3.0",
  },
  "The University of Illinois/NCSA Open Source License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/NCSA",
  },
  "Sun Public License, Version 1.0": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/SPL-1.0",
  },
  "Sun Industry Standards Source License": {
    criteria: [
      "weak_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/SISSL",
  },
  "Apache Software License, version 1.1": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Apache-1.1",
  },
  "The Vovida Software License v. 1.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/VSL-1.0",
  },
  "The Sleepycat License": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Sleepycat",
  },
  "The Ricoh Source Code Public License": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/RSCPL",
  },
  "Reciprocal Public License, version 1.1": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/RPL-1.1",
  },
  "RealNetworks Public Source License Version 1.0": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/RPSL-1.0",
  },
  "The Q Public License Version 1.0": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/QPL-1.0",
  },
  "Python License, Version 2": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Python-2.0",
  },
  "The CNRI portion of the multi-part Python License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/CNRI-Python",
  },
  "The Nethack General Public License": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/NGPL",
  },
  "Nokia Open Source License Version 1.0a": {
    criteria: ["copyleft", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/Nokia",
  },
  "The OCLC Research Public License 2.0 License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/OCLC-2.0",
  },
  "Open Group Test Suite License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/OGTSL",
  },
  "The Open Software License 3.0": {
    criteria: [
      "copyleft",
      "commercial_use",
      "patent_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/OSL-3.0",
  },
  "PHP License 3.0": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/PHP-3.0",
  },
  "Apache License 2.0": {
    criteria: [
      "permissive",
      "commercial_use",
      "patent_protection",
      "trademark_protection",
      "modification",
      "distribution",
    ],
    link: "https://opensource.org/licenses/Apache-2.0",
  },
  "Creative Commons Zero v1.0 Universal": {
    criteria: [
      "public_domain",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "BSD 2-Clause License": {
    criteria: ["permissive", "commercial_use", "modification", "distribution"],
    link: "https://opensource.org/licenses/BSD-2-Clause",
  },
  "GNU General Public License v2.0": {
    criteria: [
      "strong_copyleft",
      "commercial_use",
      "modification",
      "distribution",
    ],
    link: "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html",
  },
};

// Function to suggest licenses based on user answers
function suggestLicenses(
  answers: boolean[]
): { license: string; link: string }[] {
  let compatibility: { [key in LicenseType]: number } = Object.fromEntries(
    Object.keys(licenses).map((license) => [license, 0])
  ) as { [key in LicenseType]: number };

  answers.forEach((answer, i) => {
    if (answer) {
      for (let license in licenses) {
        if (licenses[license as LicenseType].criteria.includes(criteria[i])) {
          compatibility[license as LicenseType] += 1;
        }
      }
    }
  });

  // Return the top 6 licenses with their links
  return Object.entries(compatibility)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([license]) => ({
      license,
      link: licenses[license as LicenseType].link,
    }));
}

// export async function POST(request: Request) {
//   const { answers } = await request.json();

//   const suggestions = suggestLicenses(answers);
//   return NextResponse.json({ suggestions });
// }

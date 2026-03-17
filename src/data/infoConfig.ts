export interface InfoLink {
  label: string;
  url: string;
}

export interface InfoPageContent {
  title: string;
  sections: {
    heading: string;
    text: string;
  }[];
  links?: InfoLink[];
}

export const INFO_CONTENT: Record<string, InfoPageContent> = {
  about: {
    title: "The Story Behind PulseThread",
    sections: [
      {
        heading: "The Inspiration",
        text: "In 2026, my mother was battling cancer, and consistent access to blood became the lifeline for her treatment. During this critical time, I experienced the harsh reality of the current donation ecosystem: chaos and exploitation. I was personally scammed—sending money for travel costs to a 'donor' who never showed up. Beyond the financial loss, the emotional toll was devastating. I spent hours calling 50-60 people from public lists, only to hear they were unavailable. Dependence on social media meant algorithmic delays and uncertainty.",
      },
      {
        heading: "Logistics of Life",
        text: "I realized that while we have technology to track a pizza delivery in real-time, we were still relying on chaotic phone trees to save lives. I wanted to build the 'Uber for Blood'—a platform that replaces uncertainty with logistics. PulseThread isn't just a donor list; it's a real-time coordination engine designed to get the right blood to the right place, immediately.",
      },
      {
        heading: "The Philosophy",
        text: "We don't just connect data points; we connect the pulse of a donor to the thread of a life hanging in the balance. PulseThread is built to serve humanity, not profit. It is source-available to ensure transparency and community trust, protecting the mission from commercial exploitation.",
      }
    ]
  },
  privacy: {
    title: "Privacy & Data Policy",
    sections: [
      {
        heading: "1. Data Collection & Purpose",
        text: "PulseThread collects minimal personal data necessary for life-saving coordination. This includes your name, phone number, blood type, and voluntary health metrics (Age, Weight). This data is used solely to match donors with recipients and verify eligibility.",
      },
      {
        heading: "2. Precise Location Handling",
        text: "We do not store your exact home or work GPS coordinates. Preferred donation areas are stored as general locality names (e.g., 'Dhanmondi'). Real-time GPS is used only during active donor searches or when you explicitly request blood to ensure proximity accuracy.",
      },
      {
        heading: "3. Data Sharing & Third Parties",
        text: "Your contact details (Phone Number) are only disclosed to another verified user once a blood donation match is confirmed by both parties. We NEVER sell, rent, or trade your personal information to third-party advertisers or data brokers.",
      },
      {
        heading: "4. Data Retention & Deletion",
        text: "We retain your profile data as long as your account is active. You may request full account and data deletion at any time through the app settings or by contacting dev support. Deletion will remove all personal identifiers from our records.",
      },
      {
        heading: "5. Security Measures",
        text: "We employ industry-standard encryption and security protocols (via Supabase/PostgreSQL) to protect your data from unauthorized access, alteration, or disclosure.",
      }
    ]
  },
  conduct: {
    title: "Code of Conduct & Community Standards",
    sections: [
      {
        heading: "1. Integrity and Honesty",
        text: "PulseThread is built on a foundation of absolute trust. You must provide accurate medical information (Age, Weight, Last Donation Date) and valid identification. Falsifying donor eligibility is strictly prohibited.",
      },
      {
        heading: "2. Zero-Tolerance Abuse Policy",
        text: "Creating fake blood requests, harassment of other users, or 'ghosting' confirmed donation appointments is grounds for an immediate and permanent ban from the PulseThread ecosystem.",
      },
      {
        heading: "3. Respectful Interaction",
        text: "Users must interact with professional courtesy. This is a volunteer-driven platform. Any form of discrimination, hate speech, or commercial solicitation will result in account termination.",
      },
      {
        heading: "4. Reporting Mechanism",
        text: "If you encounter suspicious activity or inappropriate behavior, use the 'Report' feature or contact us directly. We investigate all community safety reports within 24 hours.",
      }
    ]
  },
  legal: {
    title: "Legal Identity & Liability",
    sections: [
      {
        heading: "1. Platform Nature",
        text: "PulseThread is a non-profit, open-source technological intermediary. We facilitate the discovery of potential blood donors but do not provide medical services, laboratory testing, or transport services.",
      },
      {
        heading: "2. Absolute Liability Disclaimer",
        text: "The creator, developers, and PulseThread organization bear NO liability for the outcome of any donation, medical procedure, or interaction initiated through the app. Users acknowledge that blood donation carries inherent medical risks and must be managed by licensed medical professionals.",
      },
      {
        heading: "3. No Medical Recommendation",
        text: "PulseThread does not verify the medical fitness of donors or the safety of any blood supplies. All screening and safety protocols are the sole responsibility of the attending hospital or blood bank.",
      },
      {
        heading: "4. Emergency Disclaimer",
        text: "In life-threatening situations, always contact official emergency services (e.g. 999/911) first. PulseThread is a supplementary community tool and cannot guarantee the immediate availability of specific blood types.",
      },
      {
        heading: "5. Source Available (MIT License)",
        text: "The PulseThread software is provided 'as is', without warranty of any kind. You use this platform at your own risk as per the MIT Open Source License. Commercial exploitation of the source code is strictly prohibited.",
      }
    ]
  },
  developer: {
    title: "The Developer",
    sections: [
      {
        heading: "Creator: Akhlak Hossain Jim",
        text: "PulseThread was developed by Akhlak Hossain Jim with the mission to eliminate preventable deaths caused by blood shortages through decentralized, high-speed matching technology. Driven by personal loss and the desire for social impact, this project represents the intersection of logistics and humanity.",
      }
    ],
    links: [
      { label: "Website", url: "https://akhlak.dev" },
      { label: "LinkedIn", url: "https://linkedin.com/in/akhlakhossainjim" },
      { label: "GitHub", url: "https://github.com/Akhlak-Hossain-Jim" },
      { label: "Support the Mission", url: "https://buymeacoffee.com/ahjim" }
    ]
  },
  contributors: {
    title: "Contributors & Supporters",
    sections: [
      {
        heading: "Open Innovation",
        text: "Thank you to the developers and testers from the global open-source community who have donated their time to make PulseThread faster, safer, and more accessible. Your contributions save lives every day.",
      }
    ],
    links: [
      { label: "Contribute on GitHub", url: "https://github.com/Akhlak-Hossain-Jim/pulse-thread" },
      { label: "Buy Me A Coffee", url: "https://buymeacoffee.com/ahjim" }
    ]
  },
  supporters: {
    title: "Financial Supporters",
    sections: [
      {
        heading: "Powering the Pulse",
        text: "Special thanks to the individuals and organizations who support our infrastructure costs. Your financial contributions keep our servers running, our maps API paid, and the notifications firing for those in urgent need. PulseThread is and will always be 100% free for donors and recipients alike.",
      }
    ],
    links: [
      { label: "Become a Supporter", url: "https://buymeacoffee.com/ahjim" }
    ]
  }
};

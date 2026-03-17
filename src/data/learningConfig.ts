export interface LearningModule {
  id: string;
  title: string;
  description: string;
  videoUrl?: string; // Optional YouTube video link
  showVideo: boolean; // Toggle to show/hide video
  contentBlocks: {
    id: string;
    text: string;
    show: boolean; // Toggle to show/hide specific text block
  }[];
  badgeAwarded?: string; // Badge ID awarded on completion
}

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: "learn_request",
    title: "How to Request Blood",
    description: "Learn the proper way to broadcast a blood request to nearby donors.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
    showVideo: false,
    badgeAwarded: "learned_request",
    contentBlocks: [
      {
        id: "req_1",
        text: "1. Locate your Hospital: Open the Map screen and drop a pin at the medical facility where blood is needed. PulseThread's intelligent location engine will identify the facility to ensure donors know exactly where to go.",
        show: true,
      },
      {
        id: "req_2",
        text: "2. Specify the Need: Enter critical details including Blood Type, specific Component (Whole Blood, Platelets, Plasma), and the number of units. Set the Urgency level to help donors prioritize their travel.",
        show: true,
      },
      {
        id: "req_3",
        text: "3. Instant Broadcast: Once you submit, our system instantly alerts all compatible donors within a 10km radius via high-priority push notifications.",
        show: true,
      },
      {
        id: "req_4",
        text: "Community Integrity: Only broadcast genuine, hospital-verified requests. Misuse of the emergency broadcast system drains community resources and may lead to account restrictions.",
        show: true,
      }
    ]
  },
  {
    id: "learn_donate",
    title: "The Hero's Journey: Donating",
    description: "Your commitment to donate is a commitment to save a life. Here is how the process works.",
    videoUrl: "",
    showVideo: false,
    badgeAwarded: "learned_donate",
    contentBlocks: [
      {
        id: "don_1",
        text: "1. Set Your Availability: Toggle 'Active Donor' on in your Profile. We recommend setting your 'Preferred Areas' (locality names) so we only alert you when requests are in your convenient zones.",
        show: true,
      },
      {
        id: "don_2",
        text: "2. Respond to Alerts: You'll receive notifications for matching requests nearby. Review the urgency and hospital location before accepting.",
        show: true,
      },
      {
        id: "don_3",
        text: "3. The Commitment: Tap 'Accept' only if you are certain you can attend. Recipient families rely on your response, and transparency is key to their peace of mind.",
        show: true,
      },
      {
        id: "don_4",
        text: "4. Earn Your Badge: Upon successful donation at the hospital, the requester will verify the completion, and your 'Life Saver' status will be updated on your profile!",
        show: true,
      }
    ]
  },
  {
    id: "learn_policies",
    title: "Ecosystem Ethics & Policies",
    description: "PulseThread is a community of trust. Our policies ensure the safety of both donors and recipients.",
    videoUrl: "",
    showVideo: false,
    contentBlocks: [
      {
        id: "pol_1",
        text: "PulseThread is a non-profit intermediary. We provide the logistics for discovery, but we do not provide medical screening or transport. Always follow the medical advice of certified professionals.",
        show: true,
      },
      {
        id: "pol_2",
        text: "Zero-Profit Mission: We never charge users for connecting. Any individual asking for money in exchange for blood or travel costs should be reported immediately—it's likely a scam.",
        show: true,
      },
      {
        id: "pol_3",
        text: "Safety First: If you feel unwell or have a recent medical condition, please update your 'Last Donation Date' or toggle your donor status to 'Inactive' until you are fully recovered.",
        show: true,
      }
    ]
  }
];

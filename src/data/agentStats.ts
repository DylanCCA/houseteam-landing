// Agent Performance Stats Configuration
// This file contains the performance metrics for agents displayed on the SOQ page
// Data can be updated manually or via automated sync from MLS
// Last updated: 2025-12-13

export interface AgentStats {
  agentId: string;
  agentName: string;
  salesLast12Months: number;
  totalTransactions: number;
  yearsExperience: number;
  starRating: number;
  activeListings: number;
  asOfDate: string;
}

// Tabitha House's Performance Data
// Source: RealEstateAgents.com, Century 21 Commercial, Facebook
export const tabithaHouseStats: AgentStats = {
  agentId: 'tabitha-house',
  agentName: 'Tabitha House',
  salesLast12Months: 68,
  totalTransactions: 223,
  yearsExperience: 4,
  starRating: 5.0,
  activeListings: 23,
  asOfDate: '2025-12-13',
};

// Function to get agent stats by ID
export const getAgentStats = (agentId: string): AgentStats | undefined => {
  const agents: Record<string, AgentStats> = {
    'tabitha-house': tabithaHouseStats,
  };
  return agents[agentId];
};

// Default export for convenience
export default tabithaHouseStats;

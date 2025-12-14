// Agent Performance Stats Configuration
// This file contains the performance metrics for agents displayed on the SOQ page
// Data can be updated manually or via automated sync from MLS
// Last updated: 2025-12-14 (from Bluegrass REALTORS MLS - imagine.flexmls.com)

export interface AgentStats {
  agentId: string;
  agentName: string;
  salesLast12Months: number;
  totalTransactions: number;
  yearsExperience: number;
  starRating: number;
  activeListings: number;
  totalVolume: number;
  asOfDate: string;
}

// Tabitha House's Performance Data
// Source: Bluegrass REALTORS MLS (imagine.flexmls.com) - My Production Report
// YTD 2025: 41 Total Sold, $9,336,149 Volume
// Last Year (2024): 46 Total Sold
// Current: 31 Active Listings ($9,475,100), 4 Pended ($200,663)
export const tabithaHouseStats: AgentStats = {
  agentId: 'tabitha-house',
  agentName: 'Tabitha House',
  salesLast12Months: 41,        // YTD 2025 from MLS Production Report
  totalTransactions: 87,         // 41 (2025 YTD) + 46 (2024) from MLS
  yearsExperience: 4,
  starRating: 5.0,
  activeListings: 31,            // Current active listings from MLS
  totalVolume: 9336149,          // YTD 2025 Total Sold Volume
  asOfDate: '2025-12-14',
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

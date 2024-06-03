export interface ProposalInfo {
  msg: string;
  code: number;
  data: Data;
}

export interface Data {
  proposal: Proposal;
  bpList: string[];
  organization: Organization;
  parliamentProposerList: any[];
}

export interface Proposal {
  createAt: string;
  expiredTime: string;
  approvals: number;
  rejections: number;
  abstentions: number;
  leftInfo: LeftInfo;
  releasedTime: string;
  id: number;
  orgAddress: string;
  createTxId: string;
  proposalId: string;
  proposer: string;
  contractAddress: string;
  contractMethod: string;
  contractParams: string;
  status: string;
  releasedTxId: string;
  createdBy: string;
  isContractDeployed: boolean;
  proposalType: string;
  canVote: boolean;
  votedStatus: string;
}

export interface LeftInfo {
  organizationAddress: string;
}

export interface Organization {
  createdAt: string;
  updatedAt: string;
  releaseThreshold: ReleaseThreshold;
  leftOrgInfo: LeftOrgInfo;
  orgAddress: string;
  orgHash: string;
  txId: string;
  creator: string;
  proposalType: string;
}

export interface ReleaseThreshold {
  minimalApprovalThreshold: string;
  maximalRejectionThreshold: string;
  maximalAbstentionThreshold: string;
  minimalVoteThreshold: string;
}

export interface LeftOrgInfo {
  proposerAuthorityRequired: boolean;
  parliamentMemberProposingAllowed: boolean;
  creationToken: any;
}

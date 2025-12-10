export interface CmcInfoUrls {
  website?: string[];
  twitter?: string[];
  message_board?: string[];
  chat?: string[];
  facebook?: string[];
  explorer?: string[];
  reddit?: string[];
  technical_doc?: string[];
  source_code?: string[];
  announcement?: string[];
}

export interface CmcInfoItem {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  category: string;
  description: string;
  logo: string;
  tags?: string[];
  'tag-names'?: string[];
  'tag-groups'?: string[];
  urls?: CmcInfoUrls;
  date_added?: string;
  date_launched?: string;
  infinite_supply?: boolean;
  [key: string]: any;
}

export interface CmcInfoResponse {
  status: {
    error_code: number;
    error_message: string | null;
    timestamp: string;
  };

  data: Record<string, CmcInfoItem>;
}

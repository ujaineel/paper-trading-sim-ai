export interface StockTrade {
    id: string;
    user_id: string;
    portfolio_id: string;
    asset_type: 'stock';
    ticker: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface OptionTrade {
    id: string;
    user_id: string;
    portfolio_id: string;
    asset_type: 'option';
    ticker: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export type Trade = StockTrade | OptionTrade;

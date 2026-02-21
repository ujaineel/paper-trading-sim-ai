export interface StockOrder {
    id: string;
    user_id: string;
    portfolio_id: string;
    asset_type: 'stock';
    ticker: string;
    side: 'buy' | 'sell';
    quantity: number;
    limit_price?: number;
    stop_price?: number;
    order_type: 'market' | 'limit' | 'stop';
    time_in_force: 'gtd' | 'gtc' | 'day';
    status: 'pending' | 'filled' | 'canceled' | 'rejected' | 'expired';
    rejected_reason?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    source: 'user' | 'agent';
    agent_session_id?: string;
}

export interface OptionOrder {
    id: string;
    user_id: string;
    portfolio_id: string;
    asset_type: 'option';
    ticker: string;
    side: 'buy' | 'sell';
    quantity: number;
    contract: 'call' | 'put';
    strike_price: number;
    expiration_date: string;
    limit_price?: number;
    stop_price?: number;
    order_type: 'market' | 'limit' | 'stop';
    time_in_force: 'gtd' | 'gtc' | 'day';
    status: 'pending' | 'filled' | 'canceled' | 'rejected' | 'expired';
    rejected_reason?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    source: 'user' | 'agent';
    agent_session_id?: string;
}
    
export type Order = StockOrder | OptionOrder;

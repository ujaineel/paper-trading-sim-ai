export interface Portfolio {
    id: string;
    user_id: string;
    name: string;
    cash_balance: number;
    initial_balance: number;
    realized_pnl?: number;
    unrealized_pnl?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface StockPosition {
    id: string;
    portfolio_id: string;
    ticker: string;
    side: 'long' | 'short';
    avg_cost_basis: number;
    quantity: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface OptionPosition {
    id: string;
    portfolio_id: string;
    ticker: string;
    contract_type: 'call' | 'put';
    strike_price: number;
    expiration_date: string;
    side: 'long' | 'short';
    avg_cost_basis: number;
    avg_premium: number;
    quantity: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}
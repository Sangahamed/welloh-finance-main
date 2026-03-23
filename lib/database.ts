import { supabase } from './supabaseClient';
import type { UserAccount, StockHolding, Transaction, WatchlistItem, HistoryItem, Alert, Prediction, Bet } from '../types';

/**
 * Fetches all necessary user data from the new database schema and assembles it
 * into the single UserAccount object the application expects.
 */
export const getUserAccount = async (userId: string): Promise<UserAccount | null> => {
    if (!supabase) return null;
    
    // 1. Fetch profile and portfolio sequentially as they are critical
    const { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', userId).single();

    if (profileError || !profile) { 
        console.error('Error fetching profile:', profileError?.message); 
        return null; 
    }

    const { data: portfoliosData, error: portfolioError } = await supabase
        .from('portfolios').select('*').eq('user_id', userId);

    if (portfolioError || !portfoliosData || portfoliosData.length === 0) {
        console.error('Error fetching portfolio:', portfolioError?.message || 'No portfolio found');
        return null;
    }
    const portfolio = portfoliosData[0];

    // 2. Fetch all other data in parallel for maximum performance
    const [
        holdingsRes,
        transactionsRes,
        watchlistRes,
        historyRes,
        alertsRes,
        followingRes,
        followersRes
    ] = await Promise.all([
        supabase.from('holdings').select('ticker, shares, purchase_price, exchange').eq('portfolio_id', portfolio.id),
        supabase.from('transactions').select('*').eq('portfolio_id', portfolio.id).order('timestamp', { ascending: false }),
        supabase.from('watchlists').select('id').eq('user_id', userId).single(),
        supabase.from('analysis_histories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('analysis_alerts').select('*').eq('user_id', userId),
        supabase.from('following').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('following').select('*', { count: 'exact', head: true }).eq('following_id', userId)
    ]);

    // Handle results
    const holdingsData = holdingsRes.data || [];
    const dbTransactions = transactionsRes.data || [];
    
    // Watchlist items fetch (conditional on watchlist id)
    let watchlistItems: WatchlistItem[] = [];
    if (watchlistRes.data) {
        const { data: items } = await supabase
            .from('watchlist_items')
            .select('ticker, exchange')
            .eq('watchlist_id', watchlistRes.data.id);
        if (items) {
            watchlistItems = items.map(item => ({ ticker: item.ticker, exchange: item.exchange }));
        }
    }

    const holdings: StockHolding[] = holdingsData.map(h => ({
        ticker: h.ticker,
        exchange: h.exchange,
        companyName: '',
        shares: h.shares,
        purchasePrice: h.purchase_price,
    }));
    
    const transactions: Transaction[] = dbTransactions.map(t => ({
        id: t.id,
        type: t.type.toLowerCase() as 'buy' | 'sell',
        ticker: t.ticker,
        exchange: t.exchange,
        companyName: '',
        shares: t.shares,
        price: t.price,
        timestamp: new Date(t.timestamp).getTime(),
    }));

    const analysisHistory: HistoryItem[] = (historyRes.data || []).map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        companyIdentifier: item.company_identifier,
        comparisonIdentifier: item.comparison_identifier,
        currency: item.currency,
        analysisData: item.analysis_data,
        news: item.news_data,
    }));

    const alerts: Alert[] = (alertsRes.data || []).map(item => ({
        id: item.id,
        metricLabel: item.metric_label,
        condition: item.condition,
        threshold: item.threshold,
    }));

    return {
        id: profile.id,
        fullName: profile.full_name,
        role: profile.role || 'user',
        createdAt: profile.created_at,
        isSuspended: profile.is_suspended ?? false,
        isVerified: profile.is_verified ?? false,
        followingCount: followingRes.count || 0,
        followersCount: followersRes.count || 0,
        portfolio: {
            cash: portfolio.cash_balance,
            initialValue: portfolio.initial_capital,
            holdings: holdings,
        },
        transactions: transactions,
        watchlist: watchlistItems,
        analysisHistory,
        alerts,
    };
};

// ... (rest of the file)

// ─── Moderation & Certification Functions ────────────────────────────────────

export const createReport = async (report: Omit<import('../types').Report, 'id' | 'createdAt' | 'status'>): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.from('reports').insert({
        reporter_id: report.reporterId,
        target_id: report.targetId,
        target_type: report.targetType,
        reason: report.reason,
    });
    return !error;
};

export const getReports = async (): Promise<import('../types').Report[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(r => ({
        id: r.id,
        reporterId: r.reporter_id,
        targetId: r.target_id,
        targetType: r.target_type,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
    }));
};

export const resolveReport = async (reportId: string, status: 'resolved' | 'dismissed'): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
    return !error;
};

export const issueCertificate = async (adminId: string, userId: string, type: string, metadata: any = {}): Promise<boolean> => {
    if (!supabase) return false;
    
    // 1. Mark user as verified
    await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
    
    // 2. Create certificate record
    const { error: certError } = await supabase.from('certificates').insert({
        user_id: userId,
        type,
        metadata
    });
    
    // 3. Log the action
    await recordAdminLog(adminId, 'issue_certificate', userId, { type, metadata });
    
    return !certError;
};

export const getCertificates = async (userId: string): Promise<import('../types').Certificate[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('certificates').select('*').eq('user_id', userId);
    if (error) return [];
    return (data || []).map(c => ({
        id: c.id,
        userId: c.user_id,
        type: c.type,
        issuedAt: c.issued_at,
        metadata: c.metadata,
    }));
};

export const recordAdminLog = async (adminId: string, action: string, targetId?: string, details: any = {}): Promise<void> => {
    if (!supabase) return;
    await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action,
        target_id: targetId,
        details
    });
};

export const getAdminLogs = async (): Promise<import('../types').AdminLog[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
    if (error) return [];
    return (data || []).map(l => ({
        id: l.id,
        adminId: l.admin_id,
        action: l.action,
        targetId: l.target_id,
        details: l.details,
        timestamp: l.timestamp,
    }));
};

/**
 * Updates a user account by disassembling the partial UserAccount object
 * and targeting the correct tables in the new database schema.
 */
export const updateUserAccount = async (userId: string, updates: Partial<UserAccount>): Promise<UserAccount | null> => {
    if (!supabase) return null;

    const { data: currentPortfolio } = await supabase.from('portfolios').select('id').eq('user_id', userId).single();
    if (!currentPortfolio) throw new Error("Cannot update account without a portfolio.");
    const portfolioId = currentPortfolio.id;

    if (updates.portfolio) {
        const { cash, holdings } = updates.portfolio;
        await supabase.from('portfolios').update({ cash_balance: cash }).eq('id', portfolioId);
        
        // Clear and re-insert holdings
        const { error: deleteError } = await supabase.from('holdings').delete().eq('portfolio_id', portfolioId);
        if (deleteError) throw deleteError;

        if (holdings.length > 0) {
            const holdingsToInsert = holdings.map(h => ({
                portfolio_id: portfolioId,
                ticker: h.ticker,
                exchange: h.exchange,
                shares: h.shares,
                purchase_price: h.purchasePrice,
            }));
            const { error: insertError } = await supabase.from('holdings').insert(holdingsToInsert);
            if (insertError) throw insertError;
        }
    }

    if (updates.transactions && updates.transactions.length > 0) {
        // The new transaction is appended to the end of the array by the client.
        const newTransaction = updates.transactions[updates.transactions.length - 1];
        
        // The database schema generates the UUID, so we don't send the client-generated ID.
        const { error } = await supabase.from('transactions').insert({
            portfolio_id: portfolioId,
            ticker: newTransaction.ticker,
            exchange: newTransaction.exchange,
            type: newTransaction.type.toUpperCase(),
            shares: newTransaction.shares,
            price: newTransaction.price,
            timestamp: new Date(newTransaction.timestamp).toISOString(),
        });

        if (error) throw error;
    }

    if (updates.watchlist) {
        const { data: watchlist } = await supabase.from('watchlists').select('id').eq('user_id', userId).single();
        if(watchlist) {
            await supabase.from('watchlist_items').delete().eq('watchlist_id', watchlist.id);
            const itemsToInsert = updates.watchlist.map(item => ({ 
                watchlist_id: watchlist.id, 
                ticker: item.ticker,
                exchange: item.exchange
            }));
            if (itemsToInsert.length > 0) {
                 await supabase.from('watchlist_items').insert(itemsToInsert);
            }
        }
    }
    
    return getUserAccount(userId);
};


/**
 * Gets all user accounts and assembles their data for the admin dashboard.
 */
export const getAllUsers = async (): Promise<UserAccount[]> => {
    if (!supabase) return [];
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    
    if (error) {
        console.error('Error fetching all users:', error.message);
        return [];
    }

    const userAccounts = await Promise.all(
        profiles.map(profile => getUserAccount(profile.id))
    );
    
    return userAccounts.filter((account): account is UserAccount => account !== null);
};

// New functions for Analysis History
export const addAnalysisHistory = async (userId: string, item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem | null> => {
    if (!supabase) return null;
    const { error, data } = await supabase
        .from('analysis_histories')
        .insert({
            user_id: userId,
            company_identifier: item.companyIdentifier,
            comparison_identifier: item.comparisonIdentifier,
            currency: item.currency,
            analysis_data: item.analysisData,
            news_data: item.news,
        })
        .select()
        .single();
    if (error) {
        console.error("Error adding analysis history:", error.message);
        return null;
    }
    return {
        id: data.id,
        timestamp: new Date(data.created_at).getTime(),
        companyIdentifier: data.company_identifier,
        comparisonIdentifier: data.comparison_identifier,
        currency: data.currency,
        analysisData: data.analysis_data,
        news: data.news_data,
    };
};

export const clearAnalysisHistory = async (userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.from('analysis_histories').delete().eq('user_id', userId);
    if (error) {
        console.error("Error clearing analysis history:", error.message);
        return false;
    }
    return true;
};

// New functions for Alerts
export const addAlert = async (userId: string, alertData: Omit<Alert, 'id'>): Promise<Alert | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('analysis_alerts')
        .insert({
            user_id: userId,
            metric_label: alertData.metricLabel,
            condition: alertData.condition,
            threshold: alertData.threshold,
        })
        .select()
        .single();
    
    if (error) {
        console.error("Error adding alert:", error.message);
        return null;
    }
    return {
        id: data.id,
        metricLabel: data.metric_label,
        condition: data.condition,
        threshold: data.threshold,
    };
};

export const removeAlert = async (alertId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.from('analysis_alerts').delete().eq('id', alertId);
    if (error) {
        console.error("Error removing alert:", error.message);
        return false;
    }
    return true;
};

// ─── Prediction Market Functions ──────────────────────────────────────────────

export const getPredictions = async (): Promise<Prediction[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(mapPrediction);
    } catch (e) {
        console.error("Error fetching predictions:", e);
        return [];
    }
};

export const createPrediction = async (
    userId: string,
    creatorName: string,
    payload: Omit<Prediction, 'id' | 'creatorId' | 'creatorName' | 'status' | 'totalPool' | 'createdAt' | 'participantsCount' | 'resolvedOptionId'>,
    isAdmin: boolean = false
): Promise<Prediction | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('predictions')
            .insert({
                creator_id: userId,
                creator_name: creatorName,
                title: payload.title,
                description: payload.description,
                category: payload.category,
                options: payload.options,
                expires_at: payload.expiresAt,
                analysis_proof: payload.analysisProof,
                status: isAdmin ? 'active' : 'pending',
                total_pool: 0,
                participants_count: 0,
            })
            .select()
            .single();
        if (error) throw error;
        return mapPrediction(data);
    } catch (e) {
        console.error("Error creating prediction:", e);
        return null;
    }
};

export const placeBet = async (
    userId: string,
    predictionId: string,
    optionId: string,
    amount: number
): Promise<Bet | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('bets')
            .insert({ user_id: userId, prediction_id: predictionId, option_id: optionId, amount })
            .select()
            .single();
        if (error) throw error;
        await supabase.rpc('increment_prediction_pool', { p_id: predictionId, p_amount: amount });
        return {
            id: data.id,
            predictionId: data.prediction_id,
            userId: data.user_id,
            optionId: data.option_id,
            amount: data.amount,
            createdAt: data.created_at,
        };
    } catch (e) {
        console.error("Error placing bet:", e);
        return null;
    }
};

export const getUserBets = async (userId: string): Promise<Bet[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', userId);
        if (error) throw error;
        return (data || []).map(d => ({
            id: d.id,
            predictionId: d.prediction_id,
            userId: d.user_id,
            optionId: d.option_id,
            amount: d.amount,
            createdAt: d.created_at,
        }));
    } catch (e) {
        console.error("Error fetching user bets:", e);
        return [];
    }
};

export const resolvePrediction = async (predictionId: string, winningOptionId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('predictions')
            .update({ status: 'resolved', resolved_option_id: winningOptionId })
            .eq('id', predictionId);
        return !error;
    } catch (e) {
        console.error("Error resolving prediction:", e);
        return false;
    }
};

export const updatePredictionStatus = async (predictionId: string, status: 'active' | 'rejected'): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('predictions')
            .update({ status })
            .eq('id', predictionId);
        return !error;
    } catch (e) {
        console.error("Error updating prediction status:", e);
        return false;
    }
};

function mapPrediction(d: any): Prediction {
    return {
        id: d.id,
        creatorId: d.creator_id,
        creatorName: d.creator_name,
        title: d.title,
        description: d.description,
        category: d.category,
        options: d.options,
        expiresAt: d.expires_at,
        resolvedOptionId: d.resolved_option_id ?? null,
        status: d.status,
        totalPool: d.total_pool ?? 0,
        createdAt: d.created_at,
        analysisProof: d.analysis_proof,
        participantsCount: d.participants_count ?? 0,
    };
}

// ─── Admin Management Functions ───────────────────────────────────────────────

export const suspendUser = async (userId: string, suspend: boolean): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_suspended: suspend })
            .eq('id', userId);
        return !error;
    } catch (e) {
        console.error('Error suspending user:', e);
        return false;
    }
};

export const changeUserRole = async (userId: string, role: 'user' | 'admin'): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);
        return !error;
    } catch (e) {
        console.error('Error changing user role:', e);
        return false;
    }
};

export const resetUserPortfolio = async (userId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { data: portfolio } = await supabase
            .from('portfolios')
            .select('id, initial_capital')
            .eq('user_id', userId)
            .single();
        if (!portfolio) return false;

        await supabase.from('holdings').delete().eq('portfolio_id', portfolio.id);
        await supabase.from('portfolios').update({ cash_balance: portfolio.initial_capital }).eq('id', portfolio.id);
        return true;
    } catch (e) {
        console.error('Error resetting portfolio:', e);
        return false;
    }
};

export const getBetsForPrediction = async (predictionId: string): Promise<Bet[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('prediction_id', predictionId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(d => ({
            id: d.id,
            predictionId: d.prediction_id,
            userId: d.user_id,
            optionId: d.option_id,
            amount: d.amount,
            createdAt: d.created_at,
        }));
    } catch (e) {
        console.error('Error fetching bets:', e);
        return [];
    }
};

// ─── Social Trading Functions ───────────────────────────────────────────────

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { data, error } = await supabase
        .from('following')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();
    return !!data && !error;
};

export const toggleFollow = async (followerId: string, followingId: string): Promise<boolean> => {
    if (!supabase) return false;
    const alreadyFollowing = await isFollowing(followerId, followingId);
    
    if (alreadyFollowing) {
        const { error } = await supabase
            .from('following')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);
        return !error;
    } else {
        const { error } = await supabase
            .from('following')
            .insert({ follower_id: followerId, following_id: followingId });
        return !error;
    }
};
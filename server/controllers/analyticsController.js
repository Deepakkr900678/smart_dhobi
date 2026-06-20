const Order = require('../models/orderModel');
const ServiceProvider = require('../models/serviceProviderModel');
const User = require('../models/userModel');

// GET /api/analytics/provider — Provider's earnings & order trends
exports.getProviderAnalytics = async (req, res) => {
    try {
        const providerId = req.user.id;

        const completedOrders = await Order.find({
            providerId,
            paymentStatus: 'completed',
        });

        const totalEarnings = completedOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);

        const orderTrends = await Order.aggregate([
            { $match: { providerId, paymentStatus: 'completed' } },
            {
                $group: {
                    _id: { $month: { $toDate: "$createdAt" } },
                    total: { $sum: 1 },
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            totalEarnings,
            totalOrders: completedOrders.length,
            monthlyOrderTrends: orderTrends,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/analytics/admin — Admin-level revenue, top providers
exports.getAdminAnalytics = async (req, res) => {
    try {
        const orders = await Order.find({ paymentStatus: 'completed' });

        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.amount), 0);

        const commissionRate = 0.1; // 10% platform commission
        const platformCommission = totalRevenue * commissionRate;

        const topProviders = await Order.aggregate([
            { $match: { paymentStatus: 'completed' } },
            {
                $group: {
                    _id: "$providerId",
                    earnings: { $sum: { $toDouble: "$amount" } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { earnings: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            totalRevenue,
            platformCommission,
            topProviders
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
